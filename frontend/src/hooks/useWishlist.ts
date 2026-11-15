import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWishlist, saveWishlist, removeWishlist } from '../services/api'
import { useAuthStore, can } from '../auth/state'
export function useWishlist() {
  const user = useAuthStore((s) => s.user)
  const customerId = user?.id || 0
  const queryClient = useQueryClient()
  const queryKey = ['wishlist', customerId]
  const query = useQuery({ queryKey, queryFn: () => fetchWishlist(customerId), retry: false, enabled: can(user, 'wishlist.manage') })
  const mutation = useMutation({
    mutationFn: async ({ productId, saved }: { productId: number; saved: boolean }) => saved ? removeWishlist(customerId, productId) : saveWishlist(customerId, productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })
  return { ...query, products: query.data || [], toggle: mutation.mutate, saving: mutation.isPending, requiresLogin: !user, allowed: !user || can(user, 'wishlist.manage') }
}
