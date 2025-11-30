import { Language } from './types';

export const getConversationalTime = (date: Date, language: Language): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return language === Language.EN ? 'just now' 
         : language === Language.ES ? 'ahora mismo' 
         : 'à l\'instant';
  }
  
  if (diffMin < 60) {
    return language === Language.EN ? `${diffMin}m ago` 
         : language === Language.ES ? `hace ${diffMin}m` 
         : `il y a ${diffMin}m`;
  }
  
  if (diffHour < 24) {
    return language === Language.EN ? `${diffHour}h ago` 
         : language === Language.ES ? `hace ${diffHour}h` 
         : `il y a ${diffHour}h`;
  }
  
  if (diffDay === 1) {
    return language === Language.EN ? 'yesterday' 
         : language === Language.ES ? 'ayer' 
         : 'hier';
  }
  
  if (diffDay < 7) {
    return language === Language.EN ? `${diffDay} days ago` 
         : language === Language.ES ? `hace ${diffDay} días` 
         : `il y a ${diffDay} jours`;
  }

  return date.toLocaleDateString(language === Language.EN ? 'en-US' : language === Language.ES ? 'es-ES' : 'fr-FR', {
    month: 'short', day: 'numeric'
  });
};