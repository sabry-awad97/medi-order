import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/inventory/manufacturers/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/inventory/manufacturers/"!</div>
}
