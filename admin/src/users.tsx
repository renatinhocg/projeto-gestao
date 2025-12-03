import * as React from 'react'
import { List, Datagrid, TextField, EmailField, EditButton, Create, SimpleForm, TextInput, Edit, ImageField, useNotify, useRedirect, DeleteButton, useRecordContext } from 'react-admin'
import PhotoInput from './PhotoInput'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const UserList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="name" />
      <EmailField source="email" />
      <ImageField source="photoUrl" label="Photo" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
)

function uploadFile(file: File) {
  console.log('[uploadFile] starting upload for file:', file.name, file.type)
  return fetch(`${apiUrl}/s3/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type })
  })
    .then(r => r.json())
    .then(async (data) => {
      console.log('[uploadFile] presign response:', data)
      const putRes = await fetch(data.url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      console.log('[uploadFile] put result status:', putRes.status)
      return data.publicUrl
    })
}

export const UserCreate = (props: any) => {
  const notify = useNotify()
  const redirect = useRedirect()
  const onSave = async (values: any, redirectTo = 'list') => {
    try {
      console.log('[UserCreate] onSave values:', values)
      // preserve existing photoUrl when editing (react-admin doesn't include unspecified fields)
      let photoUrl = values.photoUrl ?? null
      // ImageInput may provide an object or an array; support both
      const rawFile = values.photoFile && (values.photoFile.rawFile || (Array.isArray(values.photoFile) && values.photoFile[0] && values.photoFile[0].rawFile))
      console.log('[UserCreate] detected rawFile:', rawFile)
      if (rawFile) {
        photoUrl = await uploadFile(rawFile)
        console.log('[UserCreate] uploaded photoUrl:', photoUrl)
      }
      const body = { name: values.name, email: values.email, password: values.password, photoUrl }
      const token = localStorage.getItem('token')
      const res = await fetch(`${apiUrl}/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(body)
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Create failed')
      }
      notify('User created')
      redirect('/users')
    } catch (e) {
      notify((e as Error).message || 'Error', { type: 'error' })
    }
  }

  return (
    <Create {...props} redirect="list">
      <SimpleForm save={onSave}>
        <TextInput source="name" />
        <TextInput source="email" />
        <TextInput source="password" type="password" />
        <PhotoInput source="photoUrl" label="Photo" />
      </SimpleForm>
    </Create>
  )
}

export const UserEdit = (props: any) => {
  const notify = useNotify()
  const record = useRecordContext()
  const onSave = async (values: any) => {
    try {
      console.log('[UserEdit] onSave values:', values)
      // prefer provided photoUrl, otherwise keep existing record photoUrl
      let photoUrl = values.photoUrl ?? (record && record.photoUrl) ?? null
      const rawFile = values.photoFile && (values.photoFile.rawFile || (Array.isArray(values.photoFile) && values.photoFile[0] && values.photoFile[0].rawFile))
      console.log('[UserEdit] detected rawFile:', rawFile, 'record.photoUrl:', record && record.photoUrl)
      if (rawFile) {
        photoUrl = await uploadFile(rawFile)
        console.log('[UserEdit] uploaded photoUrl:', photoUrl)
      }
      const body: any = { name: values.name, email: values.email, photoUrl }
      if (values.password) body.password = values.password

      console.log('[UserEdit] Sending PUT request with body:', { ...body, password: body.password ? '[REDACTED]' : undefined })
      console.log('[UserEdit] photoUrl being sent:', photoUrl, 'type:', typeof photoUrl)

      const token = localStorage.getItem('token')
      const res = await fetch(`${apiUrl}/users/${values.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body)
      })
      if (!res.ok) {
        const errorText = await res.text()
        console.error('[UserEdit] Update failed:', errorText)
        throw new Error('Update failed')
      }

      const responseData = await res.json()
      console.log('[UserEdit] Response from server:', responseData)
      console.log('[UserEdit] Server returned photoUrl:', responseData.photoUrl)

      notify('User updated')
    } catch (e) {
      console.error('[UserEdit] Error:', e)
      notify((e as Error).message || 'Error', { type: 'error' })
    }
  }

  return (
    <Edit {...props} mutationMode="pessimistic">
      <SimpleForm save={onSave}>
        <TextInput source="name" />
        <TextInput source="email" />
        <TextInput source="password" type="password" />
        <PhotoInput source="photoUrl" label="Photo" />
      </SimpleForm>
    </Edit>
  )
}
