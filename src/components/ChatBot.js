import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Modal,
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import { useMutation } from '@apollo/client';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SEND_CHAT_MESSAGE } from '../graphql/mutations';

/**
 * AI assistant chat widget for product recommendations.
 * @param {{navigation: object}} props Component props.
 * @return {React.JSX.Element} Floating action button and chat modal.
 */
const ChatBot = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hi! 👋 I'm your personal AI shopping assistant. \n\nI can help you find products, compare options, or suggest the perfect gear for your next adventure. What's on your mind today?",
            products: [],
            appliedFilters: [],
            followUpQuestion: null,
            metadata: null,
        },
    ]);
    const [conversationId, setConversationId] = useState(null);
    const [userId, setUserId] = useState(null);
    const flatListRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const [sendChatMessage, { loading }] = useMutation(SEND_CHAT_MESSAGE);

    /**
     * Generates a unique message identifier.
     * @param {string} [suffix=''] Optional id suffix.
     * @return {string} Unique message id.
     */
    const createMessageId = (suffix = '') => {
        return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${suffix}`;
    };

    /**
     * Formats a numeric value as currency.
     * @param {number|string} value Price value.
     * @return {string} Formatted price string.
     */
    const formatCurrency = (value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
            return '$0.00';
        }
        return `$${numeric.toFixed(2)}`;
    };

    /**
     * Removes low-value technical identifiers from assistant text.
     * @param {string} text Raw text from backend.
     * @return {string} Clean text without technical ids.
     */
    const stripTechnicalIds = (text) => {
        if (typeof text !== 'string') {
            return '';
        }

        return text
            .replace(/\(ID:\s*[A-Za-z0-9-]+\)/gi, '')
            .replace(/\bID:\s*[A-Za-z0-9-]+\b/gi, '')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    };

    /**
     * Normalizes assistant text for display.
     * @param {string} text Assistant response text.
     * @return {string} Display-safe assistant text.
     */
    const normalizeAssistantText = (text) => {
        const cleaned = stripTechnicalIds(text || '');
        if (!cleaned) {
            return "I found a few options for you. Tell me your budget or preferred style and I'll refine them.";
        }

        return cleaned
            .replace(/\s+\|/g, ' |')
            .replace(/\|\s+/g, ' | ')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    };

    /**
     * Extracts known assistant metadata flags.
     * @param {object|null|undefined} payload Response payload.
     * @return {{
     *   latencyMs: number|null,
     *   cacheHit: boolean,
     *   safetyBlocked: boolean,
     *   semanticUsed: boolean,
     * }|null} Parsed metadata.
     */
    const getAssistantMetadata = (payload) => {
        if (!payload) {
            return null;
        }

        const latencyMs = Number(payload.latencyMs);
        return {
            latencyMs: Number.isFinite(latencyMs) ? latencyMs : null,
            cacheHit: Boolean(payload.cacheHit),
            safetyBlocked: Boolean(payload.safetyBlocked),
            semanticUsed: Boolean(payload.semanticUsed),
        };
    };

    useEffect(() => {
        const getUserId = async () => {
            const storedUserId = await AsyncStorage.getItem('userId');
            setUserId(storedUserId);
        };
        getUserId();
    }, []);

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    const handleSend = async () => {
        if (!message.trim() || loading) return;

        const userMessage = {
            id: createMessageId('_user'),
            role: 'user',
            content: message.trim(),
            products: [],
        };

        setMessages(prev => [...prev, userMessage]);
        const currentMessage = message.trim();
        setMessage('');

        try {
            const { data } = await sendChatMessage({
                variables: {
                    userId: userId || 'anonymous',
                    message: currentMessage,
                    conversationId,
                },
            });

            if (data?.sendChatMessage) {
                setConversationId(data.sendChatMessage.conversationId);

                const assistantContent = data.sendChatMessage.message ||
                    "I found a few options for you. Tell me your budget or preferred style and I'll refine them.";

                const aiMessage = {
                    id: createMessageId('_ai'),
                    role: 'assistant',
                    content: normalizeAssistantText(assistantContent),
                    products: data.sendChatMessage.products || [],
                    appliedFilters: Array.isArray(data.sendChatMessage.appliedFilters)
                        ? data.sendChatMessage.appliedFilters
                        : [],
                    followUpQuestion: data.sendChatMessage.followUpQuestion || null,
                    metadata: getAssistantMetadata(data.sendChatMessage),
                };

                setMessages(prev => [...prev, aiMessage]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [
                ...prev,
                {
                    id: createMessageId('_error'),
                    role: 'assistant',
                    content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
                    products: [],
                    appliedFilters: [],
                    followUpQuestion: null,
                    metadata: null,
                },
            ]);
        }
    };

    /**
     * Handles product press.
     * @param {object} product Product object.
     * @return {void} No return value.
     */
    const handleProductPress = (product) => {
        setIsOpen(false);
        navigation.navigate('ProductDetail', { product });
    };

    /**
     * Renders rich text.
     * @param {string} text Input text.
     * @param {boolean} isUser Whether the message is from the user.
     * @return {React.JSX.Element} Rendered element.
     */
    const renderRichText = (text, isUser) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return (
            <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
                {parts.map((part, index) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                            <Text key={index} style={styles.boldText}>
                                {part.substring(2, part.length - 2)}
                            </Text>
                        );
                    }
                    return part;
                })}
            </Text>
        );
    };

    /**
     * Renders message.
     * @param {object} params Callback parameters.
     * @return {React.JSX.Element} Rendered element.
     */
    const renderMessage = ({ item }) => {
        const isUser = item.role === 'user';

        return (
            <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.aiMessage]}>
                {!isUser && (
                    <View style={styles.avatarContainer}>
                        <MaterialIcons name="smart-toy" size={20} color="#fff" />
                    </View>
                )}
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
                    {renderRichText(item.content, isUser)}
                </View>
            </View>
        );
    };

    /**
     * Renders product card.
     * @param {object} product Product object.
     * @return {React.JSX.Element} Rendered element.
     */
    const renderProductCard = (product) => (
        <TouchableOpacity
            key={product.id || `${product.name || 'product'}_${String(product.basePrice || 0)}`}
            style={styles.productCard}
            onPress={() => handleProductPress(product)}
        >
            {product.images && product.images[0] ? (
                <Image source={{ uri: product.images[0] }} style={styles.productImage} />
            ) : (
                <View style={styles.productImagePlaceholder}>
                    <MaterialIcons name="shopping-bag" size={24} color="#ccc" />
                </View>
            )}
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.productPrice}>{formatCurrency(product.basePrice)}</Text>
            </View>
        </TouchableOpacity>
    );

    /**
     * Renders item.
     * @param {object} params Callback parameters.
     * @return {React.JSX.Element} Rendered element.
     */
    const renderItem = ({ item }) => (
        <View>
            {renderMessage({ item })}
            {item.role === 'assistant' && Array.isArray(item.appliedFilters) && item.appliedFilters.length > 0 && (
                <View style={styles.filterChipRow}>
                    {item.appliedFilters.slice(0, 4).map((filter) => (
                        <View key={`${item.id}_${filter}`} style={styles.filterChip}>
                            <Text style={styles.filterChipText} numberOfLines={1}>{filter}</Text>
                        </View>
                    ))}
                </View>
            )}
            {item.role === 'assistant' && item.followUpQuestion && (
                <View style={styles.followUpContainer}>
                    <Text style={styles.followUpText}>{item.followUpQuestion}</Text>
                </View>
            )}
            {item.products && item.products.length > 0 && (
                <View style={styles.productsRow}>
                    {item.products.slice(0, 3).map(renderProductCard)}
                </View>
            )}
            {item.role === 'assistant' && item.metadata && (
                <View style={styles.metaRow}>
                    {typeof item.metadata.latencyMs === 'number' && (
                        <Text style={styles.metaText}>~{item.metadata.latencyMs}ms</Text>
                    )}
                    {item.metadata.cacheHit && (
                        <Text style={styles.metaText}>cache</Text>
                    )}
                    {item.metadata.semanticUsed && (
                        <Text style={styles.metaText}>semantic</Text>
                    )}
                </View>
            )}
        </View>
    );

    return (
        <>
            {/* Floating Chat Button */}
            <Animated.View
                style={[
                    styles.floatingButton,
                    { bottom: tabBarHeight + insets.bottom + 16 },
                    { transform: [{ scale: pulseAnim }] },
                ]}
            >
                <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() => setIsOpen(true)}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="chat" size={28} color="#fff" />
                </TouchableOpacity>
            </Animated.View>

            {/* Chat Modal */}
            <Modal
                visible={isOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsOpen(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.chatContainer}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <View style={styles.headerIcon}>
                                    <MaterialIcons name="smart-toy" size={24} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.headerTitle}>Shopping Assistant</Text>
                                    <Text style={styles.headerSubtitle}>Powered by AI</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
                                <MaterialIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Messages */}
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.messagesList}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                            onLayout={() => flatListRef.current?.scrollToEnd()}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        />

                        {/* Loading Indicator */}
                        {loading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#007AFF" />
                                <Text style={styles.loadingText}>Thinking...</Text>
                            </View>
                        )}

                        {/* Input */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Ask me anything about products..."
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                maxLength={500}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, (!message.trim() || loading) && styles.sendButtonDisabled]}
                                onPress={handleSend}
                                disabled={!message.trim() || loading}
                            >
                                <MaterialIcons name="send" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    floatingButton: {
        position: 'absolute',
        right: 20,
        zIndex: 1000,
    },
    chatButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    chatContainer: {
        height: '85%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F7F7F8',
        borderBottomWidth: 1,
        borderBottomColor: '#E6E8EB',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    closeButton: {
        padding: 8,
    },
    messagesList: {
        padding: 16,
        paddingBottom: 8,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-end',
    },
    userMessage: {
        justifyContent: 'flex-end',
    },
    aiMessage: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    messageBubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 16,
    },
    userBubble: {
        backgroundColor: '#2563EB',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: '#F3F4F6',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    userText: {
        color: '#fff',
    },
    aiText: {
        color: '#111827',
    },
    boldText: {
        fontWeight: 'bold',
    },
    productsRow: {
        flexDirection: 'row',
        marginLeft: 40,
        marginBottom: 16,
        paddingTop: 4,
    },
    filterChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginLeft: 40,
        marginTop: -4,
        marginBottom: 8,
    },
    filterChip: {
        backgroundColor: '#EEF4FF',
        borderColor: '#D9E6FF',
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
        maxWidth: '90%',
        marginRight: 6,
        marginBottom: 6,
    },
    filterChipText: {
        color: '#1D4ED8',
        fontSize: 12,
        fontWeight: '600',
    },
    followUpContainer: {
        marginLeft: 40,
        marginBottom: 8,
    },
    followUpText: {
        fontSize: 13,
        color: '#4B5563',
        fontStyle: 'italic',
    },
    metaRow: {
        flexDirection: 'row',
        marginLeft: 40,
        marginTop: -6,
        marginBottom: 10,
    },
    metaText: {
        fontSize: 11,
        color: '#9CA3AF',
        marginRight: 8,
    },
    productCard: {
        width: 120,
        marginRight: 10,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E6E8EB',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    productImage: {
        width: '100%',
        height: 90,
        resizeMode: 'cover',
    },
    productImagePlaceholder: {
        width: '100%',
        height: 90,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        padding: 10,
    },
    productName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 16,
    },
    loadingText: {
        marginLeft: 8,
        color: '#6B7280',
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#E6E8EB',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        backgroundColor: '#F3F4F6',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        marginRight: 8,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
});

export default ChatBot;
