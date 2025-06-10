import { transcribeAudio } from './whisper'

// Simple keyword matching for now
// In a real implementation, this would use more sophisticated NLP
const KEYWORDS = [
  'introduction', 'overview', 'background', 'methodology',
  'results', 'conclusion', 'summary', 'next steps',
  'challenge', 'solution', 'benefit', 'impact',
  'data', 'analysis', 'research', 'study',
  'implementation', 'development', 'design', 'architecture'
]

export async function analyzeAlignment(
  audioBlob: Blob,
  currentSlideText: string
): Promise<number> {
  try {
    // Get transcript from audio
    const transcript = await transcribeAudio(audioBlob)
    
    // Convert both texts to lowercase for comparison
    const lowerTranscript = transcript.toLowerCase()
    const lowerSlideText = currentSlideText.toLowerCase()
    
    // Count matching keywords
    let matchCount = 0
    let totalKeywords = 0
    
    KEYWORDS.forEach(keyword => {
      if (lowerSlideText.includes(keyword)) {
        totalKeywords++
        if (lowerTranscript.includes(keyword)) {
          matchCount++
        }
      }
    })
    
    // Calculate alignment score
    const alignmentScore = totalKeywords > 0 ? matchCount / totalKeywords : 0
    
    return alignmentScore
  } catch (error) {
    console.error('Error analyzing content alignment:', error)
    return 0
  }
}

// Function to extract text from current slide
// This would be implemented based on your slide capture method
export function getCurrentSlideText(): string {
  // For now, return a placeholder
  return "This is a placeholder for the current slide text. In a real implementation, this would capture the actual text from the current slide."
} 