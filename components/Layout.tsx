import React, { ReactNode} from 'react'
import { Container, Row } from 'react-bootstrap'

export interface LayoutProps {
    children: ReactNode[]
}

function Layout<LayoutProps>({children}) {
    return (
        <Container id="layout-container">
        <Row >
          {children}
        </Row>
      </Container>
    )
}

export default Layout
