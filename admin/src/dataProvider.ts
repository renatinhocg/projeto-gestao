import { fetchUtils, DataProvider } from 'react-admin'
import simpleRestProvider from 'ra-data-simple-rest'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const httpClient = (url: string, options: any = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ 'Content-Type': 'application/json' })
  }
  const token = localStorage.getItem('token')
  if (token) {
    (options.headers as Headers).set('Authorization', `Bearer ${token}`)
  }
  // Add credentials for CORS
  options.credentials = 'include'
  return fetchUtils.fetchJson(url, options)
}

const baseDataProvider = simpleRestProvider(apiUrl, httpClient)

const dataProvider: DataProvider = {
  ...baseDataProvider,

  // Override create to support custom endpoints
  create: async (resource, params) => {
    // Handle custom endpoints via meta
    if (params.meta?.endpoint) {
      const url = `${apiUrl}${params.meta.endpoint}`
      const { json } = await httpClient(url, {
        method: 'POST',
        body: JSON.stringify(params.data)
      })
      return { data: json }
    }

    return baseDataProvider.create(resource, params)
  },

  // Override update to support custom endpoints
  update: async (resource, params) => {
    // Handle custom endpoints via meta
    if (params.meta?.endpoint) {
      const url = `${apiUrl}${params.meta.endpoint}`
      const { json } = await httpClient(url, {
        method: 'PUT',
        body: JSON.stringify(params.data)
      })
      return { data: json }
    }

    return baseDataProvider.update(resource, params)
  },

  // Override delete to support custom endpoints
  delete: async (resource, params) => {
    // Handle custom endpoints via meta
    if (params.meta?.endpoint) {
      const url = `${apiUrl}${params.meta.endpoint}`
      const { json } = await httpClient(url, {
        method: 'DELETE'
      })
      return { data: json }
    }

    return baseDataProvider.delete(resource, params)
  }
}

export default dataProvider
