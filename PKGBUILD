# Maintainer: inzexg-coder <amenokeakira@gmail.com>
# Contributor: Ameni Agent
pkgname=ameni-tg-parser
pkgver=1.0.0
pkgrel=1
pkgdesc="Ameni TG Parser — Telegram chat export analyzer with web interface and CLI agent"
arch=('any')
url="https://github.com/inzexg-coder/ameni-tg-parser"
license=('MIT')
depends=('bash' 'nodejs' 'npm')
source=("${pkgname}-${pkgver}.tar.gz::${url}/archive/v${pkgver}.tar.gz")
sha256sums=('SKIP')

package() {
  cd "${srcdir}/${pkgname}-${pkgver}"
  install -d "${pkgdir}/usr/share/${pkgname}"
  cp -r .ameni "${pkgdir}/usr/share/${pkgname}/"
  cp index.html parser.js style.css "${pkgdir}/usr/share/${pkgname}/"
  install -Dm644 README.md "${pkgdir}/usr/share/doc/${pkgname}/README.md"

  # Symlink CLI
  install -Dm755 .ameni/bin/ameni "${pkgdir}/usr/bin/ameni"
}
