import moment from 'moment';

export const timeAgo = (dateString: string): string => {
  const now = moment();
  const date = moment(dateString);
  const diffInMinutes = now.diff(date, 'minutes');
  const diffInHours = now.diff(date, 'hours');
  const diffInDays = now.diff(date, 'days');
  const diffInWeeks = now.diff(date, 'weeks');
  const diffInMonths = now.diff(date, 'months');

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  
  return date.format('MMM D, YYYY');
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// export const isValidImageType = (filename: string): boolean => {
//   const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
//   const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
//   return imageTypes.includes(extension);
// };

// export const isValidFileType = (filename: string): boolean => {
//   const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'];
//   const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
//   return allowedTypes.includes(extension);
// };