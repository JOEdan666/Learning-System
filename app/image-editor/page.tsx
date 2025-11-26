'use client'
import { useEffect, useRef, useState } from 'react'

export default function ImageEditorPage() {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null)
  const [feather, setFeather] = useState<number>(8)
  const [compare, setCompare] = useState<number>(50)
  const [selecting, setSelecting] = useState<boolean>(false)
  const [selection, setSelection] = useState<{x:number;y:number;w:number;h:number}|null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const beforeCanvasRef = useRef<HTMLCanvasElement>(null)
  const afterCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const loadImage = (src: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setOriginalImg(img)
      drawInitial(img)
    }
    img.onerror = () => {}
    img.src = src
  }

  const drawInitial = (img: HTMLImageElement) => {
    const b = beforeCanvasRef.current!
    const a = afterCanvasRef.current!
    b.width = img.naturalWidth
    b.height = img.naturalHeight
    a.width = img.naturalWidth
    a.height = img.naturalHeight
    const bc = b.getContext('2d')!
    bc.drawImage(img, 0, 0)
    const ac = a.getContext('2d')!
    ac.drawImage(img, 0, 0)
  }

  const handleFile = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      setImageUrl(url)
      loadImage(url)
    }
    reader.readAsDataURL(file)
  }

  const startSelect = (e: React.MouseEvent) => {
    if (!beforeCanvasRef.current) return
    const rect = beforeCanvasRef.current.getBoundingClientRect()
    const x = Math.round((e.clientX - rect.left) * (beforeCanvasRef.current.width / rect.width))
    const y = Math.round((e.clientY - rect.top) * (beforeCanvasRef.current.height / rect.height))
    setSelection({ x, y, w: 0, h: 0 })
    setSelecting(true)
  }

  const moveSelect = (e: React.MouseEvent) => {
    if (!selecting || !selection || !beforeCanvasRef.current) return
    const rect = beforeCanvasRef.current.getBoundingClientRect()
    const x2 = Math.round((e.clientX - rect.left) * (beforeCanvasRef.current.width / rect.width))
    const y2 = Math.round((e.clientY - rect.top) * (beforeCanvasRef.current.height / rect.height))
    setSelection({ x: selection.x, y: selection.y, w: x2 - selection.x, h: y2 - selection.y })
    drawOverlay()
  }

  const endSelect = () => {
    setSelecting(false)
    drawOverlay()
  }

  const drawOverlay = () => {
    if (!beforeCanvasRef.current || !originalImg) return
    const b = beforeCanvasRef.current
    const bc = b.getContext('2d')!
    bc.clearRect(0,0,b.width,b.height)
    bc.drawImage(originalImg,0,0)
    if (selection) {
      const {x,y,w,h} = normalizeRect(selection)
      bc.save()
      bc.strokeStyle = 'rgba(46,134,222,0.9)'
      bc.lineWidth = 2
      bc.setLineDash([6,4])
      bc.strokeRect(x,y,w,h)
      bc.restore()
    }
  }

  const normalizeRect = (sel:{x:number;y:number;w:number;h:number}) => {
    const x = sel.w < 0 ? sel.x + sel.w : sel.x
    const y = sel.h < 0 ? sel.y + sel.h : sel.y
    const w = Math.abs(sel.w)
    const h = Math.abs(sel.h)
    return { x, y, w, h }
  }

  const applyDeletion = () => {
    if (!selection || !afterCanvasRef.current || !beforeCanvasRef.current) return
    const a = afterCanvasRef.current
    const ac = a.getContext('2d')!
    const b = beforeCanvasRef.current
    const {x,y,w,h} = normalizeRect(selection)
    const temp = document.createElement('canvas')
    temp.width = a.width
    temp.height = a.height
    const tc = temp.getContext('2d')!
    tc.drawImage(a,0,0)
    ac.save()
    ac.clearRect(0,0,a.width,a.height)
    ac.drawImage(temp,0,0)
    const blurCanvas = document.createElement('canvas')
    blurCanvas.width = a.width
    blurCanvas.height = a.height
    const blc = blurCanvas.getContext('2d')!
    blc.filter = `blur(${feather}px)`
    blc.drawImage(temp,0,0)
    ac.globalCompositeOperation = 'source-over'
    ac.drawImage(blurCanvas, x, y, w, h, x, y, w, h)
    ac.restore()
    drawOverlay()
  }

  const exportImage = () => {
    if (!afterCanvasRef.current) return
    const url = afterCanvasRef.current.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'edited.png'
    a.click()
  }

  useEffect(() => {
    const demo = '/intelligent.jpg'
    setImageUrl(demo)
    loadImage(demo)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-3">图片编辑器</h1>
        <div className="flex flex-wrap gap-3 mb-4 text-sm">
          <input ref={inputRef} type="file" accept="image/*" onChange={(e)=>handleFile(e.target.files?.[0])} className="border border-slate-200 rounded px-3 py-2"/>
          <input value={imageUrl} onChange={(e)=>setImageUrl(e.target.value)} placeholder="粘贴图片链接" className="border border-slate-200 rounded px-3 py-2 flex-1 min-w-[220px]"/>
          <button onClick={()=>loadImage(imageUrl)} className="px-3 py-2 rounded bg-blue-600 text-white">加载</button>
          <div className="flex items-center gap-2">
            <span>羽化</span>
            <input type="range" min={0} max={24} value={feather} onChange={(e)=>setFeather(parseInt(e.target.value))} />
            <span>{feather}px</span>
          </div>
          <button onClick={applyDeletion} className="px-3 py-2 rounded bg-indigo-600 text-white">删除所选</button>
          <button onClick={exportImage} className="px-3 py-2 rounded bg-slate-900 text-white">导出</button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow p-4">
          <div className="text-sm text-slate-600 mb-2">拖拽选择要删除的区域，点击“删除所选”。</div>
          <div ref={containerRef} className="relative w-full overflow-auto">
            <div className="relative inline-block">
              <canvas
                ref={beforeCanvasRef}
                onMouseDown={startSelect}
                onMouseMove={moveSelect}
                onMouseUp={endSelect}
              />
              <div className="absolute top-2 right-2 z-10 bg-white/80 rounded px-2 py-1 text-xs">原图</div>
            </div>
            <div className="relative inline-block ml-4">
              <div className="absolute inset-0 z-10 pointer-events-none" style={{clipPath:`inset(0 ${100-compare}% 0 0)`}}>
                <canvas ref={afterCanvasRef} />
                <div className="absolute top-2 right-2 bg-white/80 rounded px-2 py-1 text-xs">编辑后</div>
              </div>
              <canvas style={{visibility:'hidden'}} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm">
            <span>对比</span>
            <input type="range" min={0} max={100} value={compare} onChange={(e)=>setCompare(parseInt(e.target.value))} />
            <span>{compare}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

