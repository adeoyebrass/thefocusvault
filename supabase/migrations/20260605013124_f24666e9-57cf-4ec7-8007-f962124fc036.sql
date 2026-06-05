-- Restrict friendship status changes to recipient only; requester may only cancel (delete)
DROP POLICY IF EXISTS "recipient responds" ON public.friendships;

CREATE POLICY "recipient updates status"
ON public.friendships
FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Allow users to delete their own face verification files
CREATE POLICY "Users delete their own face verifications"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'face-verifications'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
