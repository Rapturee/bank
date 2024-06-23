import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
};

// Data Arrays
let users = [];
let accounts = [];
let sessions = [];

// Create User
app.post('/users', (req, res) => {
  const { username, password } = req.body;
  const id = users.length + 1;
  users.push({ id, username, password });
  accounts.push({ id: accounts.length + 1, userId: id, type: 'primary', amount: 0 });
  accounts.push({ id: accounts.length + 1, userId: id, type: 'savings', amount: 0 });
  res.status(201).json({ message: 'User created successfully' });
});

// Login User
app.post('/sessions', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const token = generateOTP();
    sessions.push({ userId: user.id, token });
    res.status(200).json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Get Profile
app.post('/me/profile', (req, res) => {
  const { token } = req.body;
  const session = sessions.find(s => s.token === token);
  if (session) {
    const user = users.find(u => u.id === session.userId);
    if (user) {
      res.status(200).json({ username: user.username, email: `${user.username}@example.com` });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } else {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Get Account Balance
app.post('/me/accounts', (req, res) => {
  const { token } = req.body;
  const session = sessions.find(s => s.token === token);
  if (session) {
    const userAccounts = accounts.filter(a => a.userId === session.userId);
    res.status(200).json(userAccounts);
  } else {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Deposit Money
app.post('/me/accounts/transactions', (req, res) => {
  const { token, amount } = req.body;
  const session = sessions.find(s => s.token === token);
  if (session) {
    const account = accounts.find(a => a.userId === session.userId && a.type === 'primary');
    if (account) {
      account.amount += amount;
      res.status(200).json({ message: 'Deposit successful', amount: account.amount });
    } else {
      res.status(404).json({ message: 'Account not found' });
    }
  } else {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Transfer Money
app.post('/me/transfer', (req, res) => {
  const { token, fromAccountId, toAccountId, amount } = req.body;
  const session = sessions.find(s => s.token === token);
  if (session) {
    const fromAccount = accounts.find(a => a.id === fromAccountId && a.userId === session.userId);
    const toAccount = accounts.find(a => a.id === toAccountId && a.userId === session.userId);
    if (fromAccount && toAccount) {
      if (fromAccount.amount >= amount) {
        fromAccount.amount -= amount;
        toAccount.amount += amount;
        res.status(200).json({ message: 'Transfer successful' });
      } else {
        res.status(400).json({ message: 'Insufficient funds' });
      }
    } else {
      res.status(404).json({ message: 'Account not found' });
    }
  } else {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Create Additional Account
app.post('/me/accounts/create', (req, res) => {
  const { token, type } = req.body;
  const session = sessions.find(s => s.token === token);
  if (session) {
    const userId = session.userId;
    const newAccount = {
      id: accounts.length + 1,
      userId,
      type,
      amount: 0
    };
    accounts.push(newAccount);
    res.status(201).json({ message: 'Account created successfully', account: newAccount });
  } else {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
