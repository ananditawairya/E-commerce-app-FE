// AI Shopping Assistant - ChatBot Component
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
import { SEND_CHAT_MESSAGE } from '../graphql/mutations';

const ChatBot = ({ navigation }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hi! 👋 I'm your personal AI shopping assistant. \n\nI can help you find products, compare options, or suggest the perfect gear for your next adventure. What's on your mind today?",
            products: [],
        },
    ]);
    const [conversationId, setConversationId] = useState(null);
    const [userId, setUserId] = useState(null);
    const flatListRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const [sendChatMessage, { loading }] = useMutation(SEND_CHAT_MESSAGE);

    useEffect(() => {
        const getUserId = async () => {
            const storedUserId = await AsyncStorage.getItem('userId');
            setUserId(storedUserId);
        };
        getUserId();
    }, []);

    // Pulse animation for the chat button
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
            id: Date.now().toString(),
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

                const aiMessage = {
                    id: Date.now().toString() + '_ai',
                    role: 'assistant',
                    content: data.sendChatMessage.message,
                    products: data.sendChatMessage.products || [],
                };

                setMessages(prev => [...prev, aiMessage]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now().toString() + '_error',
                    role: 'assistant',
                    content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
                    products: [],
                },
            ]);
        }
    };

    const handleProductPress = (product) => {
        setIsOpen(false);
        navigation.navigate('ProductDetail', { product });
    };

    const renderRichText = (text, isUser) => {
        // Simple bold text renderer for **text**
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

    const renderProductCard = (product) => (
        <TouchableOpacity
            key={product.id}
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
                <Text style={styles.productPrice}>${product.basePrice}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderItem = ({ item }) => (
        <View>
            {renderMessage({ item })}
            {item.products && item.products.length > 0 && (
                <View style={styles.productsRow}>
                    {item.products.slice(0, 3).map(renderProductCard)}
                </View>
            )}
        </View>
    );

    return (
        <>
            {/* Floating Chat Button */}
            <Animated.View style={[styles.floatingButton, { transform: [{ scale: pulseAnim }] }]}>
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
        bottom: 90,
        right: 20,
        zIndex: 1000,
    },
    chatButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
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
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#666',
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
        backgroundColor: '#007AFF',
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
        backgroundColor: '#007AFF',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: '#f0f0f0',
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
        color: '#333',
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
    productCard: {
        width: 120,
        marginRight: 10,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
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
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        padding: 10,
    },
    productName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2d3436',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 16,
    },
    loadingText: {
        marginLeft: 8,
        color: '#666',
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        backgroundColor: '#f5f5f5',
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
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
});

export default ChatBot;
