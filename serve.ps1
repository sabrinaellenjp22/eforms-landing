$root = "C:\Users\sabrina.pacote\Documents\eForms\landing"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:5180/")
$listener.Start()

$mime = @{
  ".html"="text/html"; ".css"="text/css"; ".js"="application/javascript";
  ".svg"="image/svg+xml"; ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg";
  ".ico"="image/x-icon"; ".json"="application/json"
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $ctx.Response.KeepAlive = $false
  $ctx.Response.Headers.Set("Connection", "close")
  $path = $ctx.Request.Url.LocalPath
  if ($path -eq "/") { $path = "/index.html" }
  $file = Join-Path $root ($path.TrimStart("/"))
  if (Test-Path $file -PathType Leaf) {
    $ext = [System.IO.Path]::GetExtension($file)
    $ctx.Response.ContentType = $mime[$ext]
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.OutputStream.Close()
}
