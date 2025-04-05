'use client'

import { useState, useEffect } from 'react'
import QuranVisualization from '@/components/quran-visualization'
import VerseDetails from '@/components/verse-details'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { InfoIcon, BookOpenIcon } from 'lucide-react'

export type VerseData = {
  id: string
  surah_id: number
  surah_name: string
  ayah: number
  arabic_text: string
  core_meaning: string
  english_translation: string
  x: number
  y: number
  z: number
  cluster: number
  normalizedX?: number
  normalizedY?: number
  normalizedZ?: number
}

export type ClusterData = {
  representative_id: string
  surah_id: number
  surah_name: string
  ayah: number
  core_meaning: string
  arabic_text: string
  centroid: number[]
}

export default function Home() {
  const [data, setData] = useState<{ points: VerseData[], clusters: Record<string, ClusterData> }>({ 
    points: [], 
    clusters: {} 
  })
  const [loading, setLoading] = useState(true)
  const [selectedVerse, setSelectedVerse] = useState<VerseData | null>(null)
  const [showInfo, setShowInfo] = useState(true)
  
  useEffect(() => {
    fetch('/quran_embeddings_5.json')
      .then(response => response.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading data:', error)
        setLoading(false)
      })
  }, [])
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="container mx-auto p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Quran Verses in Semantic Space</h1>
            <p className="text-muted-foreground mt-2">
              Explore the semantic relationships between Quran verses. 
              Similar colors indicate similar meanings.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="mt-2 sm:mt-0"
            onClick={() => setShowInfo(!showInfo)}
          >
            {showInfo ? <BookOpenIcon className="mr-2 h-4 w-4" /> : <InfoIcon className="mr-2 h-4 w-4" />}
            {showInfo ? "Hide Info" : "Show Info"}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className={`${showInfo ? 'lg:col-span-3' : 'lg:col-span-4'} h-[700px] bg-muted rounded-lg overflow-hidden relative`}>
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="h-[600px] w-full" />
              </div>
            ) : (
              <QuranVisualization 
                data={data.points} 
                onSelectVerse={setSelectedVerse} 
              />
            )}
            
            {selectedVerse && !showInfo && (
              <div className="absolute bottom-4 right-4 left-4 md:left-auto md:w-[350px] bg-card bg-opacity-85 backdrop-blur-sm p-4 rounded-lg shadow-lg border">
                <h3 className="text-lg font-semibold">
                  Surah {selectedVerse.surah_id}: {selectedVerse.surah_name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">Verse {selectedVerse.ayah}</p>
                <VerseDetails verse={selectedVerse} minimal />
              </div>
            )}
          </div>
          
          {showInfo && (
            <div className="lg:col-span-1">
              <Card className="h-full sticky top-4">
                <CardHeader>
                  <CardTitle>Verse Details</CardTitle>
                  <CardDescription>
                    {selectedVerse 
                      ? `Surah ${selectedVerse.surah_id}: ${selectedVerse.surah_name}`
                      : 'Select a verse to view details'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedVerse ? (
                    <VerseDetails verse={selectedVerse} />
                  ) : (
                    <div className="text-center py-20 text-muted-foreground">
                      <p>Click on any point in the visualization to view verse details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-sm text-muted-foreground">
          <h2 className="text-lg font-semibold mb-2">About this Visualization</h2>
          <p className="mb-2">
            This 3D visualization represents verses from the Quran in a semantic space. 
            Each point is a verse, positioned so that verses with similar meanings appear close together.
          </p>
          <p className="mb-2">
            <strong>Colors:</strong> Points are colored by semantic similarity clusters. 
            Verses with similar colors have similar meanings according to AI embeddings.
          </p>
          <p>
            <strong>Interaction:</strong> Click on any point to view the verse details. 
            You can rotate the view by dragging, zoom with the scroll wheel, and pan by right-click dragging.
          </p>
        </div>
      </div>
    </main>
  )
}
