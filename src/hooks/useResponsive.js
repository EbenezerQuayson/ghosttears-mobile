import { useWindowDimensions } from 'react-native';

export default function useResponsive() {
    const { width, height } = useWindowDimensions();

    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    let breakpoint = 'mobile';
    if (isTablet) breakpoint = 'tablet';
    if (isDesktop) breakpoint = 'desktop';

    return {
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        breakpoint
    };
}
