// 测试页面 - 用于验证静态资源访问

export default function TestPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">静态资源测试页面</h1>
      <p className="mb-4">尝试直接加载图片：</p>
      <img 
        src="/uni.png" 
        alt="宇航员测试图片" 
        className="max-w-full h-auto rounded-lg shadow-lg"
        style={{ maxHeight: '500px' }}
      />
      <p className="mt-6">如果图片无法显示，请检查public目录设置和文件路径</p>
    </div>
  )
}