import "react"
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react"
import { Outlet, Link, Navigate } from "react-router-dom"

export function Layout() {
    const { user } = useUser();

    return <div className="app-layout">
        <header className="app-header">
            <div className="header-content">
                <h1>
                    <SignedIn>
                        Welcome, {user?.firstName || user?.fullName || "User"}
                    </SignedIn>
                    <SignedOut>
                        Code Schedule Generator
                    </SignedOut>
                </h1>
                <nav>
                    <SignedIn>
                        <Link to="/">Generate Schedule</Link>
                        <Link to="/history">History</Link>
                        <UserButton />
                    </SignedIn>
                </nav>
            </div>
        </header>

        <main className="app-main">
            <SignedOut>
                <Navigate to="/sign-in" replace />
            </SignedOut>
            <SignedIn>
                <Outlet />
            </SignedIn>
        </main>
    </div>
}