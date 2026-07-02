'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ImageIcon, Loader2, Check, Upload, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { AdminBottomNav } from '@/components/admin-bottom-nav'
import { UserMenu } from '@/components/user-menu'
import { supabase } from '@/lib/supabase'

type ClassType = {
  id: string
  name: string
  image_url: string | null
}

// fallback images (نفس اللي في صفحة الكلاس) — بتظهر لو لسه مفيش صورة مرفوعة
const FALLBACK_BY_NAME: Record<string, string> = {
  'Power Yoga':             '/images/classes/yoga.jpg',
  'Mat Pilates':            '/images/classes/stretching.jpg',
  'Gentle Yoga & Recovery': '/images/classes/meditation.jpg',
  'Belly Rhythmic Dancing': '/images/classes/sidebend.jpg',
  'Aqua Aerobics':          '/images/venue/outdoor.jpg',
}
const FALLBACK_IMG = '/images/classes/yoga.jpg'

export default function AdminClassImagesPage() {
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    const fetchClassTypes = async () => {
      const { data } = await supabase
        .from('class_types')
        .select('id, name, image_url')
        .order('name')
      if (data) setClassTypes(data as ClassType[])
      setLoading(false)
    }
    fetchClassTypes()
  }, [])

  const handleFileSelect = async (classType: ClassType, file: File) => {
    setError(null)
    setSavedId(null)

    // تحقق إنها صورة
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    // حد أقصى 5 ميجا (الـ bucket limit برضه 50 ميجا، بس بنخليها خفيفة)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Max 5 MB.')
      return
    }

    setUploadingId(classType.id)
    try {
      // اسم ملف فريد لكل كلاس — بنحط الوقت عشان الكاش ما يعلّقش الصورة القديمة
      const ext = file.name.split('.').pop() || 'jpg'
      const safeName = classType.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const path = `class-images/${safeName}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data: pub } = supabase.storage.from('media').getPublicUrl(path)
      const publicUrl = pub.publicUrl

      const { error: updateError } = await supabase
        .from('class_types')
        .update({ image_url: publicUrl })
        .eq('id', classType.id)

      if (updateError) throw updateError

      setClassTypes(prev => prev.map(ct =>
        ct.id === classType.id ? { ...ct, image_url: publicUrl } : ct
      ))
      setSavedId(classType.id)
      setTimeout(() => setSavedId(null), 2500)
    } catch (e: any) {
      setError(e?.message || 'Upload failed. Try again.')
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <main className="bg-background min-h-screen pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/more" className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Class Images</h1>
          </div>
          <UserMenu variant="admin" />
        </div>
      </div>

      <div className="px-4 pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Tap a class to upload its cover image. It shows everywhere clients see that class.
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#006D77]" />
          </div>
        ) : classTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E0EEF0] flex items-center justify-center mb-3">
              <ImageIcon className="w-8 h-8 text-[#006D77]/40" />
            </div>
            <p className="text-sm font-medium text-foreground">No class types found</p>
            <p className="text-xs text-muted-foreground mt-1">Add class types first.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classTypes.map(ct => {
              const preview = ct.image_url || FALLBACK_BY_NAME[ct.name] || FALLBACK_IMG
              const isUploading = uploadingId === ct.id
              const isSaved = savedId === ct.id
              return (
                <div key={ct.id} className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="relative h-40 w-full bg-muted">
                    <Image
                      src={preview}
                      alt={ct.name}
                      fill
                      className="object-cover"
                      sizes="100vw"
                      unoptimized
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-7 h-7 animate-spin text-white" />
                      </div>
                    )}
                    {!ct.image_url && !isUploading && (
                      <span className="absolute top-2 left-2 text-[10px] font-medium bg-black/50 text-white px-2 py-0.5 rounded-full">
                        Default image
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{ct.name}</p>
                      {isSaved
                        ? <p className="text-xs text-[#4CAF50] flex items-center gap-1 mt-0.5"><Check className="w-3 h-3" /> Saved</p>
                        : <p className="text-xs text-muted-foreground mt-0.5">{ct.image_url ? 'Custom image' : 'Using default'}</p>
                      }
                    </div>

                    <input
                      ref={el => { fileInputs.current[ct.id] = el }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) handleFileSelect(ct, f)
                        e.target.value = '' // allow re-selecting same file
                      }}
                    />
                    <button
                      onClick={() => fileInputs.current[ct.id]?.click()}
                      disabled={isUploading}
                      className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-[#006D77] text-white text-sm font-semibold rounded-xl hover:bg-[#004E5C] transition-colors disabled:opacity-60"
                    >
                      {isUploading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><Upload className="w-4 h-4" /> Change</>
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AdminBottomNav activePage="more" />
    </main>
  )
}
