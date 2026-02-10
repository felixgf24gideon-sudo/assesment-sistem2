import { StudentProfile } from '../../../shared/types';

export function parseProfileCode(code: string): StudentProfile | null {
  const regex = /^[1-6][TP][GA][IR]$/;
  if (!regex.test(code)) {
    return null;
  }
  
  const level = parseInt(code[0]) as 1 | 2 | 3 | 4 | 5 | 6;
  const visual = code[1] as 'T' | 'P';
  const processing = code[2] as 'G' | 'A';
  const tempo = code[3] as 'I' | 'R';
  
  return {
    pedagogicalLevel: level,
    cognitiveStyle: {
      visualPreference: visual,
      processingOrientation: processing,
      behavioralTempo: tempo
    },
    profileCode: code
  };
}
