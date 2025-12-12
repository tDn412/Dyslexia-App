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

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .or(`email.eq.${email},username.eq.${username}`)
    .single();

  if (existingUser) {
    return res.status(409).json({ error: 'email or username already registered' });
  }

  // Create user
  const { data: newUser, error } = await supabase
    .from('users')
    .insert([{
      username,
      email,
      password, // In production, hash this password!
      full_name: fullName,
      age: birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : null
    }])
    .select()
    .single();

  if (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }

  const token = signToken(newUser.userid);
  res.status(201).json({
    user: {
      id: newUser.userid,
      username: newUser.username,
      email: newUser.email,
      fullName: newUser.full_name
    },
    token
  });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  // Try username first, then email (if we supported email login)
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !user || user.password !== password) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const token = signToken(user.userid);
  res.json({
    user: {
      id: user.userid,
      username: user.username,
      email: user.email,
      fullName: user.full_name
    },
    token
  });
});

router.post('/logout', (_req, res) => {
  res.json({ ok: true });
});



