/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image|icon|logo|manifest|favicon).*)',
        headers: [
          // no-cache = المتصفح بيخزّن الصفحة محلياً، لكن قبل ما يستخدمها
          // بيسأل السيرفر "هي لسه صالحة؟" — لو أيوة يرد بـ 304 (رد سريع جداً)
          // ده بيحسّن سرعة التنقل بشكل ملحوظ مع الحفاظ على حداثة الداتا
          { key: 'Cache-Control', value: 'no-cache, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ]
  },
}

export default nextConfig
