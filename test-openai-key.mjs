import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not found in environment');
  process.exit(1);
}

console.log('🔑 Testing OpenAI API key...');
console.log(`Key starts with: ${apiKey.substring(0, 10)}...`);
console.log(`Key length: ${apiKey.length} characters\n`);

const openai = new OpenAI({ apiKey });

async function testKey() {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'Say "API key works!" in 3 words only.' }
      ],
      max_tokens: 10
    });
    
    console.log('✅ OpenAI API key is VALID!');
    console.log('Response:', completion.choices[0]?.message?.content);
    
  } catch (error) {
    console.error('❌ OpenAI API key is INVALID!');
    console.error('Error:', error.message);
    
    if (error.message.includes('Incorrect API key')) {
      console.error('\n⚠️  The API key format is incorrect or expired.');
      console.error('Please check that your OPENAI_API_KEY in Vercel is correct.');
    }
  }
}

testKey();