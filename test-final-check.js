// Final verification that chat is working
async function verifyChat() {
  const prodUrl = 'https://hurt-hub-v2.vercel.app';
  
  console.log('🔍 Final Chat Verification\n');
  console.log('================================\n');
  
  // Test the simple API endpoint
  console.log('Testing Simple Chat API...');
  try {
    const res = await fetch(`${prodUrl}/api/ai-chat-simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello, are you working?' }
        ],
        module: 'business-intelligence'
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Chat API is WORKING!');
      console.log('Response:', data.content.substring(0, 100) + '...\n');
      
      console.log('📍 You can now use the chat at:');
      console.log(`   ${prodUrl}/business-intelligence`);
      console.log(`   ${prodUrl}/community`);
      console.log('\n✨ The AI chat should be visible in both sections!');
    } else {
      const error = await res.text();
      console.log('❌ Chat API Error:', res.status);
      console.log('Details:', error.substring(0, 200));
    }
  } catch (err) {
    console.log('❌ Network Error:', err.message);
    console.log('\nPlease check:');
    console.log('1. Internet connection');
    console.log('2. Vercel deployment status');
  }
  
  console.log('\n================================');
  console.log('If chat is not visible on the page, check:');
  console.log('1. Clear browser cache (Ctrl+Shift+R)');
  console.log('2. Check browser console for errors');
  console.log('3. Verify you\'re on the correct page (/business-intelligence or /community)');
}

verifyChat();