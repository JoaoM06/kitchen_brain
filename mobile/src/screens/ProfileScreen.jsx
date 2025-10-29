import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

const listaReceitas = [
  {
    id: '1',
    titulo: 'Bife à Parmegiana',
    tempo: 'Pá-Pum',
    porcoes: 'Até 2 porções',
    imagem: 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=',
  },
  {
    id: '2',
    titulo: 'Biscoito champanhe caseiro',
    tempo: 'Demorado',
    porcoes: '4 porções',
    imagem: 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=',
  },
  {
    id: '3',
    titulo: 'Arroz com Pequi',
    tempo: 'Rápido',
    porcoes: '3 porções',
    imagem: 'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=',
  },
];

export default function App() {
  const [pagina, setPagina] = useState('home');

  const renderReceita = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imagem }} style={styles.imagem} />
      <Text style={styles.titulo}>{item.titulo}</Text>
      <Text style={styles.info}>{item.tempo} • {item.porcoes}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}>🍽️ Receitas Rápidas</Text>
      </View>

      {/* CONTEÚDO */}
      {pagina === 'home' && (
        <FlatList
          data={listaReceitas}
          renderItem={renderReceita}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
        />
      )}
      {pagina === 'perfil' && (
        <View style={styles.page}>
          <Text style={styles.pageText}>👤 Página de Perfil</Text>
        </View>
      )}
      {pagina === 'favoritos' && (
        <View style={styles.page}>
          <Text style={styles.pageText}>⭐ Favoritos</Text>
        </View>
      )}

      {/* NAVBAR MAIOR E BOTÕES NO TOPO */}
      <View style={styles.navbar}>
        <View style={styles.navbarButtons}>
          <TouchableOpacity onPress={() => setPagina('home')}>
            <Text style={[styles.navText, pagina === 'home' && styles.navAtivo]}>🏠 Início</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPagina('favoritos')}>
            <Text style={[styles.navText, pagina === 'favoritos' && styles.navAtivo]}>⭐ Favoritos</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPagina('perfil')}>
            <Text style={[styles.navText, pagina === 'perfil' && styles.navAtivo]}>👤 Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    backgroundColor: '#ff7043',
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  headerText: {
    fontSize: 26,
    color: '#fff',
    fontWeight: 'bold',
  },

  lista: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffe0b2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  imagem: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    fontSize: 14,
    color: '#555',
  },


  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageText: {
    fontSize: 22,
  },


  navbar: {
    backgroundColor: '#ffcc80',
    height: 120, 
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 10,
  },
  navbarButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
  },
  navText: {
    fontSize: 18,
    color: '#333',
  },
  navAtivo: {
    fontWeight: 'bold',
    color: '#d84315',
  },
});
