import http from 'http';

const body = JSON.stringify({
  input: 'Build a chat application with real-time messaging',
  userId: 'test-user-final'
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/multi-agent-roadmap',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': body.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('✅ Request completed');
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

req.write(body);
req.end();
