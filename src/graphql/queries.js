import { gql } from '@apollo/client';

/**
 * GraphQL query definitions used by the mobile frontend.
 */

/** Fetches product listings with filters and pagination. */
export const GET_PRODUCTS = gql`
  query GetProducts(
    $search: String
    $category: String
    $minPrice: Float
    $maxPrice: Float
    $inStockOnly: Boolean
    $sortBy: ProductSortBy
    $limit: Int
    $offset: Int
  ) {
    products(
      search: $search
      category: $category
      minPrice: $minPrice
      maxPrice: $maxPrice
      inStockOnly: $inStockOnly
      sortBy: $sortBy
      limit: $limit
      offset: $offset
    ) {
      id
      name
      description
      formattedDescription
      category
      basePrice
      images
      isActive
      variants {
        id
        name
        description
        images
        priceModifier
        stock
        sku
        effectiveDescription
        effectiveImages
        effectivePrice
      }
      createdAt
      updatedAt
    }
  }
`;

/** Fetches one product by identifier. */
export const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      description
      formattedDescription
      category
      basePrice
      images
      isActive
      variants {
        id
        name
        description
        images
        priceModifier
        stock
        sku
        effectiveDescription
        effectiveImages
        effectivePrice
      }
      createdAt
      updatedAt
    }
  }
`;

/** Fetches all available product categories. */
export const GET_CATEGORIES = gql`
  query GetCategories {
    categories
  }
`;

/** Fetches the currently authenticated user profile. */
export const ME = gql`
  query Me($token: String!) {
    me(token: $token) {
      id
      email
      name
      role
      addresses {
        id
        street
        city
        state
        zipCode
        country
        isDefault
      }
    }
  }
`;

/** Fetches the authenticated buyer cart. */
export const GET_MY_CART = gql`
  query GetMyCart {
    myCart {
      id
      userId
      items {
        id
        productId
        productName
        variantId
        variantName
        quantity
        price
      }
      totalAmount
    }
  }
`;

/** Fetches order history for the authenticated buyer. */
export const GET_MY_ORDERS = gql`
  query GetMyOrders {
    myOrders {
      id
      orderId
      buyerId
      items {
        productId
        productName
        variantId
        variantName
        quantity
        price
        sellerId
      }
      totalAmount
      status
      shippingAddress {
        street
        city
        state
        zipCode
        country
      }
      paymentMethod
      createdAt
      updatedAt
    }
  }
`;

/** Fetches products owned by the authenticated seller. */
export const GET_SELLER_PRODUCTS = gql`
  query GetSellerProducts {
    sellerProducts {
      id
      sellerId
      name
      description
      formattedDescription
      category
      basePrice
      images
      isActive
      variants {
        id
        name
        description
        images
        priceModifier
        stock
        sku
        effectiveDescription
        effectiveImages
        effectivePrice
      }
      createdAt
      updatedAt
    }
  }
`;

/** Fetches orders for the authenticated seller. */
export const GET_SELLER_ORDERS = gql`
  query GetSellerOrders {
    sellerOrders {
      id
      orderId
      buyerId
      items {
        productId
        productName
        variantId
        variantName
        quantity
        price
        sellerId
      }
      totalAmount
      status
      shippingAddress {
        street
        city
        state
        zipCode
        country
      }
      paymentMethod
      createdAt
      updatedAt
    }
  }
`;

export const GET_SELLER_ANALYTICS = gql`
  query GetSellerAnalytics($days: Int) {
    sellerAnalytics(days: $days) {
      totalRevenue
      totalOrders
      averageOrderValue
      ordersByStatus {
        status
        count
      }
      trend {
        date
        revenue
        orders
      }
    }
  }
`;

export const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      orderId
      buyerId
      items {
        productId
        productName
        variantId
        variantName
        quantity
        price
        sellerId
      }
      totalAmount
      status
      shippingAddress {
        street
        city
        state
        zipCode
        country
      }
      paymentMethod
      createdAt
      updatedAt
    }
  }
`;

export const GET_RECOMMENDATIONS = gql`
  query GetRecommendations($userId: ID!, $limit: Int) {
    getRecommendations(userId: $userId, limit: $limit) {
      productId
      score
      reason
      category
    }
  }
`;

export const GET_SIMILAR_PRODUCTS = gql`
  query GetSimilarProducts($productId: ID!, $limit: Int) {
    getSimilarProducts(productId: $productId, limit: $limit) {
      productId
      score
      reason
      category
    }
  }
`;

export const GET_TRENDING_PRODUCTS = gql`
  query GetTrendingProducts($category: String, $limit: Int) {
    getTrendingProducts(category: $category, limit: $limit) {
      productId
      score
      reason
      category
    }
  }
`;

export const GET_RECENTLY_VIEWED = gql`
  query GetRecentlyViewed($userId: ID!, $limit: Int) {
    getRecentlyViewed(userId: $userId, limit: $limit) {
      productId
      score
      reason
      category
    }
  }
`;
