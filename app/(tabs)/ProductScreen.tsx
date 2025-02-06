import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// ✅ Define Product Type
export interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl?: string;
}

// ✅ Backend API URL
const API_URL = "http://localhost:8001/api/products"; // Replace with your actual backend URL

// ✅ Fetch Products Function
const fetchProducts = async (): Promise<Product[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

export default function ProductScreen() {
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
  });

  // ✅ Fetch Products
  const { data: products, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // ✅ Create Product Mutation
  const createMutation = useMutation({
    mutationFn: async (newProduct: { name: string; price: number; category: string; description: string }) =>
      axios.post(API_URL, newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setNewProduct({ name: "", price: "", category: "", description: "" });
    },
  });

  // ✅ Update Product Mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedProduct: { _id: string; name: string; price: number; category: string; description: string }) =>
      axios.put(`${API_URL}/${updatedProduct._id}`, updatedProduct),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  // ✅ Delete Product Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => axios.delete(`${API_URL}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
  const handleSubmit = () => {
    if (!name || !price || !category || !description) return;

    const productData = { name, price: Number(price), category, description };

    if (editProductId) {
      updateMutation.mutate({ ...productData, _id: editProductId });
    } else {
      createMutation.mutate(productData);
    }
  };

  const handleEdit = (product: Product) => {
    setEditProductId(product._id);
    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category);
    setDescription(product.description);
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setCategory("");
    setDescription("");
    setEditProductId(null);
  };

  if (isLoading) return <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />;
  if (error instanceof Error) return <Text style={styles.error}>Error: {error.message}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product List</Text>

      {/* ✅ Form */}
      <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" style={styles.input} />
      <TextInput placeholder="Category" value={category} onChangeText={setCategory} style={styles.input} />
      <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
      <Button title={editProductId ? "Update Product" : "Add Product"} onPress={handleSubmit} />
      {editProductId && <Button title="Cancel" color="gray" onPress={resetForm} />}

      {/* ✅ Product List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.productContainer}>
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.productImage} /> : null}
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productCategory}>{item.category}</Text>
              <Text style={styles.productDescription}>{item.description}</Text>
              <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.button, styles.editButton]}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteMutation.mutate(item._id)}style={[styles.button, styles.deleteButton]}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, padding: 8, marginVertical: 5, borderRadius: 5 },
  productContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
  },
  productImage: { width: 60, height: 60, borderRadius: 10, marginRight: 10 },
  productInfo: { flex: 1 },
  productName: { fontSize: 18, fontWeight: "bold" },
  productCategory: { fontSize: 14, color: "gray" },
  productDescription: { fontSize: 14, marginTop: 4, color: "#555" },
  productPrice: { fontSize: 16, fontWeight: "bold", marginTop: 5 },
  buttonsContainer: { flexDirection: "row" },
  button: { padding: 5, borderRadius: 5, marginLeft: 5 },
  editButton: { backgroundColor: "#3498db" },
  deleteButton: { backgroundColor: "#e74c3c" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "red", textAlign: "center", marginTop: 10 },
});
