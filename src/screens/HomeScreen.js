import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, Platform } from 'react-native';

export default function HomeScreen({ navigation }) {
    const navigateTo = (screen, params) => {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
            document.activeElement?.blur?.();
        }
        navigation.navigate(screen, params);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                
                {/* Cartoon Game Header / Ribbon Plaque */}
                <View style={styles.bannerContainer}>
                    <View style={styles.bannerWingLeft} />
                    <View style={styles.bannerMain}>
                        <Text style={styles.bannerText}>GHOSTTEARS</Text>
                    </View>
                    <View style={styles.bannerWingRight} />
                </View>

                <View style={styles.subtitleBadge}>
                    <Text style={styles.subtitleText}>WORD SURVIVAL CHALLENGE</Text>
                </View>

                {/* Main Dialog Window */}
                <View style={styles.menuCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderTitle}>SELECT MODE</Text>
                    </View>

                    <View style={styles.buttonList}>
                        {/* Play Solo (Green 3D Button) */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.btn3D,
                                styles.greenBtn,
                                pressed && styles.btn3DPressed
                            ]}
                            onPress={() => navigateTo('Setup', { mode: 'single' })}
                        >
                            <View style={styles.btnContent}>
                                <Text style={styles.btnTitle}>Play Solo</Text>
                                <Text style={styles.btnSub}>VS AI BOT</Text>
                            </View>
                        </Pressable>

                        {/* Host Game (Teal 3D Button) */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.btn3D,
                                styles.tealBtn,
                                pressed && styles.btn3DPressed
                            ]}
                            onPress={() => navigateTo('Setup', { mode: 'host' })}
                        >
                            <View style={styles.btnContent}>
                                <Text style={styles.btnTitle}>Host Game</Text>
                                <Text style={styles.btnSub}>CREATE PRIVATE ROOM</Text>
                            </View>
                        </Pressable>

                        {/* Join Game (Orange 3D Button) */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.btn3D,
                                styles.orangeBtn,
                                pressed && styles.btn3DPressed
                            ]}
                            onPress={() => navigateTo('Lobby', { mode: 'join' })}
                        >
                            <View style={styles.btnContent}>
                                <Text style={styles.btnTitle}>Join Game</Text>
                                <Text style={styles.btnSub}>ENTER 4-LETTER CODE</Text>
                            </View>
                        </Pressable>
                    </View>
                </View>

                {/* Bottom rule / hint */}
                <View style={styles.footerNote}>
                    <Text style={styles.footerText}>Complete a word or bluff falsely to lose a life!</Text>
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F3E7',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 24,
        maxWidth: 440,
        width: '100%',
        alignSelf: 'center',
    },
    bannerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        position: 'relative',
    },
    bannerWingLeft: {
        width: 18,
        height: 38,
        backgroundColor: '#D77500',
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        marginRight: -4,
        transform: [{ translateY: 4 }],
    },
    bannerWingRight: {
        width: 18,
        height: 38,
        backgroundColor: '#D77500',
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        marginLeft: -4,
        transform: [{ translateY: 4 }],
    },
    bannerMain: {
        backgroundColor: '#FFA114',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 16,
        borderBottomWidth: 5,
        borderBottomColor: '#D77500',
        zIndex: 10,
        shadowColor: '#D77500',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    bannerText: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 2,
        textAlign: 'center',
        ...Platform.select({
            web: { textShadow: '0px 2px 2px rgba(0, 0, 0, 0.25)' },
            default: {
                textShadowColor: 'rgba(0, 0, 0, 0.25)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 2,
            }
        }),
    },
    subtitleBadge: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#E6DFC8',
        borderBottomWidth: 4,
        borderBottomColor: '#D6CDB5',
        marginBottom: 24,
    },
    subtitleText: {
        color: '#7C6F5A',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    menuCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 3,
        borderColor: '#E8E1CF',
        borderBottomWidth: 6,
        borderBottomColor: '#D4CBB4',
        padding: 20,
        alignItems: 'center',
    },
    cardHeader: {
        marginBottom: 16,
    },
    cardHeaderTitle: {
        color: '#8C7E6A',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    buttonList: {
        width: '100%',
        gap: 14,
    },
    btn3D: {
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            web: {
                cursor: 'pointer',
                userSelect: 'none',
            }
        })
    },
    btn3DPressed: {
        transform: [{ translateY: 3 }],
        borderBottomWidth: 2,
    },
    greenBtn: {
        backgroundColor: '#6DC328',
        borderBottomWidth: 5,
        borderBottomColor: '#4A8D15',
    },
    tealBtn: {
        backgroundColor: '#00A8B5',
        borderBottomWidth: 5,
        borderBottomColor: '#007A84',
    },
    orangeBtn: {
        backgroundColor: '#FFA114',
        borderBottomWidth: 5,
        borderBottomColor: '#D77500',
    },
    btnContent: {
        alignItems: 'center',
    },
    btnTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 0.5,
        ...Platform.select({
            web: { textShadow: '0px 1.5px 1px rgba(0, 0, 0, 0.2)' },
            default: {
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 0, height: 1.5 },
                textShadowRadius: 1,
            }
        }),
    },
    btnSub: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        marginTop: 2,
    },
    footerNote: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    footerText: {
        color: '#9E927E',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    }
});
