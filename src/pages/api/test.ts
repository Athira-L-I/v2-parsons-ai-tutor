import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  message: string;
  timestamp: number;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({ 
    message: 'API is working!', 
    timestamp: Date.now() 
  });
}