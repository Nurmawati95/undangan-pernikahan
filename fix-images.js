// Perbaiki index.html: ganti URL foto sementara (lh3.googleusercontent) ke file lokal assets/
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'index.html');
let h = fs.readFileSync(file, 'utf8');
const map = [
  ['AEtjO1WSd-ufJV5ICGP5G-QGrLuHci2qE9--hUMX1nCFvzKJluq6m_oN84lJZB8j0Is1m8AqixK8WnY7aha9894fqxEHy-10GL2ss5a2L0gqifHlUXKstwcn0o9JOo6fCPKb4FcnPndwr7QUsMI29LJsyxxU7TK6mTtNO2fpzVnVUbpUwxm3VsVMgNaqxCZpnqBjCZvsuScwIPA6OQYXaV4EPrkCfQa7moqqyScGqLF6ZLJ-aNGNfHr7hz8Z7lwf', 'assets/couple.jpg'],
  ['AEtjO1VOYDEFAESNJ2nUcR_8w5M-_YmDBOBGAzQXFcfXBXqRGCBbeypT5b0s2JyZ4Og7YO4AKBXVjb2SP4SSJZ63GWMdkA7DfWydjV2UF-fztaAuKpw1Uqn7YrTG6CeI95FDMdz4n9Eadwd_-K1VdIJ1khww1nWsJgQIFZJKNTy2Nlko-qTwq9UwI0zknbGfu27_QkjcNzAOUdlOSnPM3M9FwiwWspsw0JVZ9I5nbm7PZoks6j842uy5scY9H5An', 'assets/groom.jpg'],
  ['AEtjO1VsV0yxXeL1X0-yKmc2YChzsDgu7VoZrQ8-ni6Q0yWEeG-ctBOPfzJxnA7U0iZwd29YisyQlhkKOkEcROzASetWhOm7W8CFqoKpYZ8U2RaN_hrJEFE9ivJ1B_9Pco6sGTYCUK7TI-kXl2xaI9kWSa2B7-FEFFwDJdF0D6M3d-iw8cnRWz_NcoiXbGqV0wtZGZ2X0pErcagxgWGE-8hXJcxiI9doClz_b5I0D7yd4uC8oWYp--YxNYyu5bo3', 'assets/bride.jpg'],
];
let total = 0;
for (const [id, local] of map) {
  const re = new RegExp('https://lh3\\.googleusercontent\\.com/aida/' + id.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
  const m = h.match(re);
  if (m) { total += m.length; h = h.replace(re, local); console.log(local + ': ' + m.length + ' diganti'); }
}
fs.writeFileSync(file, h);
console.log('TOTAL diganti: ' + total);
