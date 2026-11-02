import base64, re, sys
R='NenThomStore.Web/wwwroot/'
rd=lambda p: open(p,encoding='utf-8').read()
def uri(p,mime): return 'data:%s;base64,%s'%(mime,base64.b64encode(open(R+p,'rb').read()).decode())
app=rd(R+'js/app.js')
for p,m in [('images/banner/banner-wide.jpg','image/jpeg'),('images/brand/mascot-beach-1.jpg','image/jpeg'),('images/logo/logo-aura-candle.png','image/png'),('images/logo/logo-square.jpg','image/jpeg')]:
    app=app.replace(p,uri(p,m))
cfg="window.APP_CONFIG={apiBase:'',placeholder:'%s',brand:{name:'The Aura Candle',tagline:'Hương thơm bừng lên phong cách sống'}};"%uri('images/placeholder-product.svg','image/svg+xml')
css=rd(R+'lib/bootstrap/bootstrap.min.css')+rd(R+'css/site.css')+"""
html{box-sizing:border-box}body{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
[data-bs-theme=dark]{--bg:#0f1d27}[data-bs-theme=dark] body{background:var(--bg)}
[data-bs-theme=dark] h1,[data-bs-theme=dark] h2,[data-bs-theme=dark] h3,[data-bs-theme=dark] h4,[data-bs-theme=dark] h5{color:#e8f4fb}
[data-bs-theme=dark] .aura-nav,[data-bs-theme=dark] .panel,[data-bs-theme=dark] .stat,[data-bs-theme=dark] .stat-box,[data-bs-theme=dark] .product-card{background:#182a37;color:#e6eef4}
[data-bs-theme=dark] .aura-nav .nav-link,[data-bs-theme=dark] .nav-pills .nav-link{color:#e8f4fb}
[data-bs-theme=dark] .info-band{background:#2a2a22;color:#eee}[data-bs-theme=dark] .text-dark{color:#e6eef4!important}[data-bs-theme=dark] .chip{background:#1d3444;color:#e8f4fb}
"""
js=lambda s: s.replace('</script','<\\/script')
out='''<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>The Aura Candle – Demo NenThomStore</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>%s</style></head><body><script>if(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.setAttribute('data-bs-theme','dark');</script>
<div class="demo-bar">Bản demo giao diện – dữ liệu mẫu chạy trong trình duyệt, đặt lại khi tải lại trang. Bản thật dùng ASP.NET Core + SQL Server (trong file ZIP).</div>
<div id="nav"></div><main id="app" class="container py-4"></main><footer id="footer"></footer><div id="toasts" class="toast-container position-fixed bottom-0 end-0 p-3"></div><div id="modalHost"></div>
<script>%s</script><script>%s</script><script>%s</script><script>%s</script></body></html>'''%(css,js(rd(R+'lib/bootstrap/bootstrap.bundle.min.js')),cfg,js(rd('demo/demo-api.js')),js(app))
import os; os.makedirs('/mnt/user-data/outputs',exist_ok=True)
open(sys.argv[1],'w',encoding='utf-8').write(out); print(len(out)//1024,'KB')
