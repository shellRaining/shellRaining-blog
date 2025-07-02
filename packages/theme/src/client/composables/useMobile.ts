import { ref, onMounted } from "vue";

export function useMobile() {
  const isMobile = ref(false);

  onMounted(() => {
    const userAgent = window.navigator.userAgent;
    isMobile.value =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent,
      );
  });

  return { isMobile };
}
