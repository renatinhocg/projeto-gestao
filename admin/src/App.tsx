import * as React from 'react'
import { Admin, Resource, CustomRoutes } from 'react-admin'
import { Route } from 'react-router-dom'
import dataProvider from './dataProvider'
import { UserList, UserCreate, UserEdit } from './users'
import authProvider from './authProvider'
import theme from './theme'
import Layout from './layout/Layout'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Kanban from './pages/Kanban'

import LawsuitSearch from './pages/LawsuitSearch'
import Notifications from './pages/Notifications'
import Teams from './pages/Teams'
import Projects from './pages/Projects'

export default function App() {
  const basename = import.meta.env.VITE_ADMIN_BASENAME || ''

  return (
    <Admin
      layout={Layout}
      theme={theme}
      dataProvider={dataProvider}
      authProvider={authProvider}
      dashboard={Dashboard}
      {...(basename ? { basename } : {})}
    >
      <Resource name="users" list={UserList} create={UserCreate} edit={UserEdit} />
      <CustomRoutes>
        <Route path="/profile" element={<Profile />} />
        <Route path="/kanban" element={<Kanban />} />
        <Route path="/lawsuits" element={<LawsuitSearch />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/projects" element={<Projects />} />
      </CustomRoutes>
    </Admin>
  )
}
