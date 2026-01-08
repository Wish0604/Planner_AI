import http from 'http';

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/telemetry/stream'
};

console.log('🔌 Connecting to SSE endpoint...');

const req = http.request(options, (res) => {
  console.log('✅ Connected, status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let lineCount = 0;
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk.toString();
    const lines = data.split('\n');
    
    // Process complete lines
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i].startsWith('data: ')) {
        lineCount++;
        const msg = lines[i].substring(6);
        console.log(`📨 Line ${lineCount}:`, msg.substring(0, 80));
      }
    }
    
    // Keep incomplete line
    data = lines[lines.length - 1];
  });
  
  res.on('end', () => {
    console.log('❌ Connection closed');
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

req.end();

// Close after 10 seconds
setTimeout(() => {
  console.log('\n⏰ Timeout - closing connection');
  process.exit(0);
}, 10000);
