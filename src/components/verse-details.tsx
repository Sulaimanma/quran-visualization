import { VerseData } from '@/app/page'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

type VerseDetailsProps = {
  verse: VerseData
  minimal?: boolean
}

const VerseDetails = ({ verse, minimal = false }: VerseDetailsProps) => {
  if (minimal) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium leading-6" dir="rtl" lang="ar">
          {verse.arabic_text}
        </p>
        <p className="text-sm">
          {verse.english_translation}
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-sm text-muted-foreground mb-2">Verse Information</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Surah:</div>
          <div>{verse.surah_id}. {verse.surah_name}</div>
          
          <div className="font-medium">Verse:</div>
          <div>{verse.ayah}</div>
          
          <div className="font-medium">Semantic Cluster:</div>
          <div>
            <Badge variant="outline" className="bg-opacity-20" style={{
              backgroundColor: `hsl(${verse.cluster * 360 / 20}, 100%, 50%, 0.2)`,
              borderColor: `hsl(${verse.cluster * 360 / 20}, 100%, 50%, 0.5)`
            }}>
              Group {verse.cluster}
            </Badge>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="font-medium text-sm text-muted-foreground mb-2">Arabic Text</h3>
        <p className="text-lg font-medium leading-8" dir="rtl" lang="ar">
          {verse.arabic_text}
        </p>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="font-medium text-sm text-muted-foreground mb-2">English Translation</h3>
        <p className="text-md leading-6">
          {verse.english_translation}
        </p>
      </div>
    </div>
  )
}
export default VerseDetails