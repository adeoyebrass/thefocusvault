
CREATE POLICY "Users read own face files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'face-verifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own face files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'face-verifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own face files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'face-verifications' AND auth.uid()::text = (storage.foldername(name))[1]);
