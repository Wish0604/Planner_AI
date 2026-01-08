const run = async () => {
  try {
    const res = await fetch('http://localhost:8080/generate-roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: `Generate a roadmap for a Node.js API project. Project name: Test. Repo: https://github.com/example/repo. Stack: node. Goal: build an api. Description: desc.`
      }),
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log(text);
  } catch (err) {
    console.error('Request failed', err);
    process.exit(1);
  }
};

run();
