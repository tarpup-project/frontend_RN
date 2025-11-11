import { useState } from 'react';
import { UserMessage } from '@/types/groups';

export const useMessageReply = () => {
  const [replyingTo, setReplyingTo] = useState<UserMessage | undefined>(undefined);

  const startReply = (message: UserMessage) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(undefined);
  };

  return {
    replyingTo,
    startReply,
    cancelReply,
  };
};