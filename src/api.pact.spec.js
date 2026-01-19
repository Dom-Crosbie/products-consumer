// Contract tests for products-consumer API interactions
import { PactV3 } from '@pact-foundation/pact';
import { API } from './api';
import { MatchersV3 } from '@pact-foundation/pact';
import { Product } from './product';
const { eachLike, like } = MatchersV3;
const Pact = PactV3;

const mockProvider = new Pact({
  consumer: 'products-consumer',
  provider: process.env.PACT_PROVIDER
    ? process.env.PACT_PROVIDER
    : 'backend-provider'
});

describe('API Pact test', () => {
  describe('retrieving a product', () => {
    test('ID 10 exists', async () => {
      // Arrange
      const expectedProduct = {
        id: '10',
        type: 'CREDIT_CARD',
        name: '28 Degrees',
        version: 'v1'
      };

      mockProvider
        .given('a product with ID 10 exists')
        .uponReceiving('a request to get a product')
        .withRequest({
          method: 'GET',
          path: '/v1/product/10',
          headers: {
            Authorization: like('Bearer dynamic-token')
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: like(expectedProduct)
        });
      return mockProvider.executeTest(async (mockserver) => {
        // Act
        const api = new API(mockserver.url);
        const product = await api.getProduct('10');

        // Assert - did we get the expected response
        expect(product).toStrictEqual(new Product(expectedProduct));
        return;
      });
    });

    test('product does not exist', async () => {
      // Arrange
      const expectedErrorMessage = 'Request failed with status code 404';

      mockProvider
        .given('a product with ID 12 does not exist')
        .uponReceiving('a request to get a product')
        .withRequest({
          method: 'GET',
          path: '/v1/product/12',
          headers: {
            Authorization: like('Bearer dynamic-token')
          }
        })
        .willRespondWith({
          status: 404
        });
      return mockProvider.executeTest(async (mockserver) => {
        const api = new API(mockserver.url);

        // Act & Assert
        await expect(api.getProduct('12')).rejects.toThrow(expectedErrorMessage);
        return;
      });
    });
  });

  describe('retrieving products', () => {
    test('products exist', async () => {
      // Arrange
      const expectedProduct = {
        id: '10',
        type: 'CREDIT_CARD',
        name: '28 Degrees',
        version: 'v1'
      };

      mockProvider
        .given('products exist')
        .uponReceiving('a request to get all products')
        .withRequest({
          method: 'GET',
          path: '/v1/products',
          headers: {
            Authorization: like('Bearer dynamic-token')
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: eachLike(expectedProduct)
        });
      return mockProvider.executeTest(async (mockserver) => {
        // Act
        const api = new API(mockserver.url);
        const products = await api.getAllProducts();

        // Assert
        expect(products).toStrictEqual([new Product(expectedProduct)]);
        return;
      });
    });
  });
});