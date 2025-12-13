import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../utils/supabaseClient.js';

export const router = Router();

function signToken(userId: string) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  const { fullName, username, email, password, confirmPassword, birthDate } = req.body ?? {};

  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'username, email, password, and confirmPassword are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'passwords do not match' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'invalid email format' });
  }

  try {
    // Use Supabase Auth for registration
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
          age: birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : null
        }
      }
    });

    if (error) {
      console.error('Registration error:', error);
      return res.status(400).json({ error: error.message || 'Registration failed' });
    }

    const token = signToken(data.user!.id);
    res.status(201).json({
      user: {
        id: data.user!.id,
        username,
        email: data.user!.email,
        fullName
      },
      token
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    // Supabase Auth uses email for login, so we need to treat username as email
    // Or modify to accept email in the frontend
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username.includes('@') ? username : `${username}@temp.com`, // Fallback for username-only
      password
    });

    if (error) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const token = signToken(data.user.id);
    res.json({
      user: {
        id: data.user.id,
        username: data.user.user_metadata?.username || username,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', (_req, res) => {
  res.json({ ok: true });
});



