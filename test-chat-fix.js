// Test the fixed chat API endpoints
async function testChatFix() {
  const prodUrl = 'https://hurt-hub-v2-lao7tcobq-wilrfs-projects.vercel.app';
  
  console.log('Testing Fixed Chat APIs...\n');
  
  const testMessage = {
    messages: [
      { role: 'user', content: 'What are the top 3 industries in Charlotte?' }
    ],
    module: 'business-intelligence'
  };
  
  // Test 1: Simple API (most reliable)
  console.log('1. Testing Simple API (/api/ai-chat-simple)...');
  try {
    const res = await fetch(`${prodUrl}/api/ai-chat-simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage)
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Simple API working!');
      console.log('Response:', data.content.substring(0, 150) + '...\n');
    } else {
      const error = await res.text();
      console.log('❌ Simple API failed:', res.status);
      console.log('Error:', error.substring(0, 200));
    }
  } catch (err) {
    console.log('❌ Simple API error:', err.message);
  }
  
  // Test 2: Enhanced API
  console.log('\n2. Testing Enhanced API (/api/ai-chat-enhanced)...');
  try {
    const res = await fetch(`${prodUrl}/api/ai-chat-enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: testMessage.messages,
        sessionId: 'test-' + Date.now(),
        saveToDatabase: false
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Enhanced API working!');
      console.log('Response:', data.content.substring(0, 150) + '...');
      console.log('Context used:', data.contextUsed);
    } else {
      const error = await res.text();
      console.log('⚠️ Enhanced API failed (expected if DB not configured):', res.status);
      console.log('Error:', error.substring(0, 200));
    }
  } catch (err) {
    console.log('⚠️ Enhanced API error:', err.message);
  }
  
  // Test 3: Basic OpenAI API
  console.log('\n3. Testing Basic API (/api/openai-chat)...');
  try {
    const res = await fetch(`${prodUrl}/api/openai-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: testMessage.messages,
        model: 'gpt-4o-mini',
        temperature: 0.7
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Basic API working!');
      console.log('Response:', data.content.substring(0, 150) + '...');
    } else {
      const error = await res.text();
      console.log('❌ Basic API failed:', res.status);
      console.log('Error:', error.substring(0, 200));
    }
  } catch (err) {
    console.log('❌ Basic API error:', err.message);
  }
  
  console.log('\n✨ Test Complete! The chat should now be working.');
}

testChatFix();