import * as React from 'react'
import { FieldTitle, useNotify, useRecordContext, useRefresh, useInput } from 'react-admin'
import { useState, useEffect } from 'react'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// For create flow we upload to server (proxy) to avoid CORS issues with direct S3 PUT
async function uploadViaServer(file: File) {
  console.log('[PhotoInput] uploadViaServer start', file.name)
  const fd = new FormData()
  fd.append('file', file)
  const token = localStorage.getItem('token')
  const res = await fetch(`${apiUrl}/s3/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd
  })
  if (!res.ok) {
    const txt = await res.text()
    console.error('[PhotoInput] uploadViaServer failed:', txt)
    throw new Error(txt || 'upload failed')
  }
  const data = await res.json()
  console.log('[PhotoInput] uploadViaServer success', data)
  return data.publicUrl
}

export default function PhotoInput(props: any) {
  const notify = useNotify()
  const record = useRecordContext()
  const refresh = useRefresh()
  const { field } = useInput(props)
  const [uploaded, setUploaded] = useState<string | null>(null)

  useEffect(() => {
    if (field.value) setUploaded(field.value)
  }, [field.value])

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    try {
      // If editing an existing user, POST multipart to server which will upload to S3 and persist
      if (record && record.id) {
        const fd = new FormData()
        fd.append('file', file)
        const token = localStorage.getItem('token')
        console.log('[PhotoInput] POST /users/' + record.id + '/photo starting, token present=', !!token)
        const res = await fetch(`${apiUrl}/users/${record.id}/photo`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd
        })
        console.log('[PhotoInput] /users/:id/photo response status=', res.status)
        if (!res.ok) {
          const txt = await res.text()
          console.error('[PhotoInput] server response:', txt)
          throw new Error(txt || 'upload failed')
        }
        const data = await res.json()
        console.log('[PhotoInput] server returned', data)
        setUploaded(data.publicUrl)
        field.onChange(data.publicUrl) // Update form value
        notify('Photo uploaded and saved', { type: 'info' })
        // refresh react-admin data so the updated photoUrl is fetched
        try { refresh() } catch (e) { /* ignore */ }
      } else {
        // Create flow: use server proxy to upload
        const publicUrl = await uploadViaServer(file)
        setUploaded(publicUrl)
        field.onChange(publicUrl) // Update form value
        notify('Photo uploaded (will be saved on create)', { type: 'info' })
      }
    } catch (err) {
      console.error(err)
      notify('Upload failed', { type: 'error' })
    }
  }

  return (
    <div>
      <FieldTitle label={props.label || 'Photo'} source={props.source} />
      {(uploaded || record?.[props.source]) && (
        <div style={{ marginBottom: 8 }}>
          <img src={uploaded || record?.[props.source]} alt="photo" style={{ maxWidth: 120, borderRadius: 4 }} />
        </div>
      )}
      <input type="file" accept="image/*" onChange={handleChange} />
    </div>
  )
}
