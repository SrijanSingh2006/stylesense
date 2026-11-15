import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWishlist, saveWishlist, removeWishlist } from '../services/api'
import { useUserStore } from '../store/useUserStore'
export function useWishlist() {
  const customerId = useUserStore((s) => s.currentUser.id)
  const queryClient = useQueryClient()
  const queryKey = ['wishlist', customerId]
  const query = useQuery({ queryKey, queryFn: () => fetchWishlist(customerId), retry: false })
  const mutation = useMutation({
    mutationFn: async ({ productId, saved }: { productId: number; saved: boolean }) => saved ? removeWishlist(customerId, productId) : saveWishlist(customerId, productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })
  return { ...query, products: query.data || [], toggle: mutation.mutate, saving: mutation.isPending }
}
