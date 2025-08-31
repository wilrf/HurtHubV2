// Test script for chat API endpoints
async function testChatAPI() {
  console.log('Testing Chat API Endpoints...\n');
  
  const testMessage = {
    messages: [
      {
        role: 'user',
        content: 'What are the top industries in Charlotte?'
      }
    ],
    model: 'gpt-4o-mini',
    temperature: 0.7
  };
  
  // Test enhanced API endpoint
  console.log('1. Testing Enhanced API (/api/ai-chat-enhanced)...');
  try {
    const enhancedRes = await fetch('https://hurt-hub-v2-gc06chbkw-wilrfs-projects.vercel.app/api/ai-chat-enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testMessage,
        sessionId: 'test-session-' + Date.now(),
        saveToDatabase: false
      })
    });
    
    if (enhancedRes.ok) {
      const data = await enhancedRes.json();
      console.log('✅ Enhanced API working!');
      console.log('Response preview:', data.content.substring(0, 100) + '...');
      console.log('Context used:', data.contextUsed);
    } else {
      const error = await enhancedRes.text();
      console.log('❌ Enhanced API failed:', enhancedRes.status, error.substring(0, 200));
    }
  } catch (err) {
    console.log('❌ Enhanced API error:', err.message);
  }
  
  console.log('\n2. Testing Basic API (/api/openai-chat)...');
  try {
    const basicRes = await fetch('https://hurt-hub-v2-gc06chbkw-wilrfs-projects.vercel.app/api/openai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage)
    });
    
    if (basicRes.ok) {
      const data = await basicRes.json();
      console.log('✅ Basic API working!');
      console.log('Response preview:', data.content.substring(0, 100) + '...');
    } else {
      const error = await basicRes.text();
      console.log('❌ Basic API failed:', basicRes.status, error.substring(0, 200));
    }
  } catch (err) {
    console.log('❌ Basic API error:', err.message);
  }
  
  console.log('\n3. Testing local development server...');
  try {
    const localRes = await fetch('http://localhost:3000/api/ai-chat-enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testMessage,
        sessionId: 'test-session-' + Date.now(),
        saveToDatabase: false
      })
    });
    
    if (localRes.ok) {
      const data = await localRes.json();
      console.log('✅ Local API working!');
      console.log('Response preview:', data.content.substring(0, 100) + '...');
    } else {
      const error = await localRes.text();
      console.log('❌ Local API failed:', localRes.status, error.substring(0, 200));
    }
  } catch (err) {
    console.log('❌ Local API error:', err.message);
  }
}

testChatAPI();