$body = @{username='admin'; password='admin'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -Body $body -ContentType 'application/json'