# Synapse Core Superadmin & Admin Logic

## Authentication & Routing

-   Superadmin and Admin use the **same existing sign-in page** as
    normal users.
-   After authentication, the system checks the user role and routes
    them to the appropriate dashboard.
-   Roles:
    -   `user` → User Dashboard
    -   `admin` → Admin Dashboard
    -   `superadmin` → Superadmin Dashboard
-   Admin and Superadmin dashboards must be separate pages/routes from
    the normal User Dashboard.
-   Role checks must be enforced by Firebase/backend security rules, not
    only by frontend routing.

## Superadmin Dashboard

Superadmin has full administrative control over the platform.

### Admin Management

-   Create admin accounts
-   Modify admin accounts
-   Delete/deactivate admin accounts
-   View admin account data
-   View admin edit/action history
-   Track who made administrative changes and when

### Theme Management

-   Theme builder/editor
-   Create and modify themes
-   Save theme presets
-   Push/publish theme presets for users
-   Manage existing published presets

### User Management

-   List and search users
-   View user information
-   Change username, display name, profile picture, and password
-   Block/suspend users
-   Reactivate users
-   View relevant account status information

### Support Tickets

-   View and manage all support tickets
-   Assign tickets to admins
-   Change ticket status/priority
-   Reply to users
-   View ticket history

### Usage Statistics

Display platform statistics in graphs and tables, including:

-   MAU
-   Total users
-   Active users
-   Cloud/storage usage
-   Support ticket volume
-   Other relevant system usage metrics

### Moderation

-   Review profile pictures
-   Review image/GIF overlays used in Workshop playlists
-   Approve, reject, or remove flagged content
-   Record moderation actions and responsible administrator

## Admin Dashboard

Admin has the same operational tools needed to manage users and daily
platform activity, but does not have Superadmin-only controls.

### User Management

-   List and search users
-   View user information
-   Change username, display name, profile picture, and password
-   Block/suspend users
-   Reactivate users
-   View account status information

### Support Tickets

-   View support tickets
-   Respond to users
-   Update ticket status/priority
-   Manage assigned tickets
-   View ticket history

### Usage Statistics

Display relevant platform statistics in graphs and tables, including:

-   MAU
-   Total users
-   Active users
-   Cloud/storage usage
-   Support ticket volume
-   Other available usage metrics

### Moderation

-   Review profile pictures
-   Review image/GIF overlays for Workshop playlists
-   Approve, reject, or remove content
-   Record moderation actions

## Permission Boundary

  Capability                                Admin   Superadmin
  --------------------------------------- ------- ------------
  User management                             Yes          Yes
  Support tickets                             Yes          Yes
  Usage statistics                            Yes          Yes
  Profile/Workshop moderation                 Yes          Yes
  Create/modify/delete admins                  No          Yes
  View admin edit history                      No          Yes
  Theme builder/publish presets                No          Yes
  Manage system-level admin permissions        No          Yes

Superadmin-only operations must be protected at the
backend/security-rule level. The frontend should hide unavailable
modules for Admin accounts, but hiding UI elements must not be treated
as authorization.
