import * as React from 'react'
import { Layout as RaLayout, LayoutProps } from 'react-admin'
import { Box } from '@mui/material'
import Topbar from './Topbar'
import Sidebar from './Sidebar'

const Layout = (props: LayoutProps) => {
    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar */}
            <Sidebar />

            {/* Main content area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Topbar />
                <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                    <RaLayout {...props} appBar={() => null} sidebar={() => null} />
                </Box>
            </Box>
        </Box>
    )
}

export default Layout
