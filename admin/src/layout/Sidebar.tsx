import * as React from 'react'
import { Box, Typography, Divider, Stack, Button, IconButton, Tooltip } from '@mui/material'
import { MenuItemLink } from 'react-admin'
import { Home01Icon, GridViewIcon, UserIcon, Menu01Icon, ArrowLeft02Icon, File02Icon, UserGroupIcon, Folder01Icon } from 'hugeicons-react'
import { SIDEBAR_WIDTH } from '../theme'

import { useLocation } from 'react-router-dom'

export default function Sidebar(props: any) {
  const [collapsed, setCollapsed] = React.useState(false)
  const location = useLocation()

  const handleToggle = () => {
    setCollapsed(!collapsed)
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const getIconColor = (path: string) => isActive(path) ? '#4318FF' : '#A3AED0'
  const getTextColor = (path: string) => isActive(path) ? '#2B3674' : '#A3AED0'
  const getFontWeight = (path: string) => isActive(path) ? 700 : 500

  return (
    <Box
      sx={{
        width: collapsed ? 80 : SIDEBAR_WIDTH,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRight: '1px solid rgba(0,0,0,0.04)',
        overflow: 'hidden', // Changed to hidden to prevent scrollbar during transition
        transition: 'width 0.3s ease',
      }}
      {...props}
    >
      {/* Logo */}
      <Box sx={{ px: collapsed ? 1 : 3, py: 3, display: 'flex', justifyContent: collapsed ? 'center' : 'space-between', alignItems: 'center' }}>
        {!collapsed && (
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', whiteSpace: 'nowrap' }}>
            Logo <Box component="span" sx={{ fontWeight: 600, color: 'text.secondary' }}>nova</Box>
          </Typography>
        )}
        <IconButton onClick={handleToggle} size="small">
          {collapsed ? <Menu01Icon size={24} /> : <ArrowLeft02Icon size={24} />}
        </IconButton>
      </Box>

      {/* Menu Items */}
      <Box sx={{ px: 2, flex: 1 }}>
        <Stack spacing={1}>
          <Tooltip title={collapsed ? "Painel" : ""} placement="right">
            <div>
              <MenuItemLink
                to="/"
                primaryText={collapsed ? "" : "Painel"}
                leftIcon={<Home01Icon size={24} color={getIconColor('/')} />}
                sx={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 2,
                  color: getTextColor('/'),
                  fontWeight: getFontWeight('/'),
                  '& .MuiListItemIcon-root': { minWidth: collapsed ? 0 : 56, color: getIconColor('/') },
                  borderRight: isActive('/') ? '4px solid #4318FF' : 'none',
                  bgcolor: isActive('/') ? 'rgba(67, 24, 255, 0.05)' : 'transparent',
                  borderRadius: '0 10px 10px 0'
                }}
              />
            </div>
          </Tooltip>
          <Tooltip title={collapsed ? "Usuários" : ""} placement="right">
            <div>
              <MenuItemLink
                to="/users"
                primaryText={collapsed ? "" : "Usuários"}
                leftIcon={<UserIcon size={24} color={getIconColor('/users')} />}
                sx={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 2,
                  color: getTextColor('/users'),
                  fontWeight: getFontWeight('/users'),
                  '& .MuiListItemIcon-root': { minWidth: collapsed ? 0 : 56, color: getIconColor('/users') },
                  borderRight: isActive('/users') ? '4px solid #4318FF' : 'none',
                  bgcolor: isActive('/users') ? 'rgba(67, 24, 255, 0.05)' : 'transparent',
                  borderRadius: '0 10px 10px 0'
                }}
              />
            </div>
          </Tooltip>
          <Tooltip title={collapsed ? "Projetos" : ""} placement="right">
            <div>
              <MenuItemLink
                to="/projects"
                primaryText={collapsed ? "" : "Projetos"}
                leftIcon={<Folder01Icon size={24} color={getIconColor('/projects')} />}
                sx={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 2,
                  color: getTextColor('/projects'),
                  fontWeight: getFontWeight('/projects'),
                  '& .MuiListItemIcon-root': { minWidth: collapsed ? 0 : 56, color: getIconColor('/projects') },
                  borderRight: isActive('/projects') ? '4px solid #4318FF' : 'none',
                  bgcolor: isActive('/projects') ? 'rgba(67, 24, 255, 0.05)' : 'transparent',
                  borderRadius: '0 10px 10px 0'
                }}
              />
            </div>
          </Tooltip>

          <Tooltip title={collapsed ? "Processos" : ""} placement="right">
            <div>
              <MenuItemLink
                to="/lawsuits"
                primaryText={collapsed ? "" : "Processos"}
                leftIcon={<File02Icon size={24} color={getIconColor('/lawsuits')} />}
                sx={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 2,
                  color: getTextColor('/lawsuits'),
                  fontWeight: getFontWeight('/lawsuits'),
                  '& .MuiListItemIcon-root': { minWidth: collapsed ? 0 : 56, color: getIconColor('/lawsuits') },
                  borderRight: isActive('/lawsuits') ? '4px solid #4318FF' : 'none',
                  bgcolor: isActive('/lawsuits') ? 'rgba(67, 24, 255, 0.05)' : 'transparent',
                  borderRadius: '0 10px 10px 0'
                }}
              />
            </div>
          </Tooltip>
          <Tooltip title={collapsed ? "Equipe" : ""} placement="right">
            <div>
              <MenuItemLink
                to="/teams"
                primaryText={collapsed ? "" : "Equipe"}
                leftIcon={<UserGroupIcon size={24} color={getIconColor('/teams')} />}
                sx={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 2,
                  color: getTextColor('/teams'),
                  fontWeight: getFontWeight('/teams'),
                  '& .MuiListItemIcon-root': { minWidth: collapsed ? 0 : 56, color: getIconColor('/teams') },
                  borderRight: isActive('/teams') ? '4px solid #4318FF' : 'none',
                  bgcolor: isActive('/teams') ? 'rgba(67, 24, 255, 0.05)' : 'transparent',
                  borderRadius: '0 10px 10px 0'
                }}
              />
            </div>
          </Tooltip>
          <Tooltip title={collapsed ? "Perfil" : ""} placement="right">
            <div>
              <MenuItemLink
                to="/profile"
                primaryText={collapsed ? "" : "Perfil"}
                leftIcon={<UserIcon size={24} color={getIconColor('/profile')} />}
                sx={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 2,
                  color: getTextColor('/profile'),
                  fontWeight: getFontWeight('/profile'),
                  '& .MuiListItemIcon-root': { minWidth: collapsed ? 0 : 56, color: getIconColor('/profile') },
                  borderRight: isActive('/profile') ? '4px solid #4318FF' : 'none',
                  bgcolor: isActive('/profile') ? 'rgba(67, 24, 255, 0.05)' : 'transparent',
                  borderRadius: '0 10px 10px 0'
                }}
              />
            </div>
          </Tooltip>
        </Stack>
      </Box>

    </Box>
  )
}
