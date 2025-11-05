import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import FooterNav from "../components/FooterNav";

const listaReceitas = [
  {
    id: '1',
    titulo: 'Bife a Parmegiana',
    tempo: 'Pá-Pum',
    porcoes: 'Até 2 porções',
    imagem:
      'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=',
  },
  {
    id: '2',
    titulo: 'Biscoito champanhe caseiro',
    tempo: 'Até 1h',
    porcoes: '30 unidades',
    imagem:
      'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=',
  },
  {
    id: '3',
    titulo: 'Sopa de espinafre',
    tempo: 'Pá-Pum',
    porcoes: 'Até 4 porções',
    imagem:
      'https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM=',
  },
];

export default function PerfilScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Receitas');

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Image source={{ uri: item.imagem }} style={styles.itemImage} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.itemTitulo}>{item.titulo}</Text>
        <Text style={styles.itemSub}>{`Tempo de preparo: ${item.tempo}`}</Text>
        <Text style={styles.itemSub}>{`Serve: ${item.porcoes}`}</Text>
      </View>
      <TouchableOpacity style={styles.bookmark}></TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Text style={styles.headerButton}>Editar</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Perfil</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Config")}>
          <Text style={styles.headerButton}>Config</Text>
        </TouchableOpacity>
      </View>

      {/* PERFIL */}
      <View style={styles.profile}>
        <Image
          source={{
            uri: 'https://marketplace.canva.com/gJly0/MAGDkMgJly0/1/tl/canva-user-profile-icon-vector.-avatar-or-person-icon.-profile-picture%2C-portrait-symbol.-MAGDkMgJly0.png',
          }}
          style={styles.avatar}
        />
        <Text style={styles.name}>Thaís Paiva</Text>
        <Text style={styles.bio}>
          Gosto de tudo que tenha queijo com tomate{'\n'}
          Prefiro salgado a doce{'\n'}
          Preguiça de usar o forno
        </Text>
      </View>

      {/* TABS */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Receitas' && styles.activeTab]}
          onPress={() => setActiveTab('Receitas')}
        >
          <Text
            style={[styles.tabText, activeTab === 'Receitas' && styles.activeTabText]}
          >
            Receitas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Postagens' && styles.activeTab]}
          onPress={() => setActiveTab('Postagens')}
        >
          <Text
            style={[styles.tabText, activeTab === 'Postagens' && styles.activeTabText]}
          >
            Postagens
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DE RECEITAS */}
      <FlatList
        data={listaReceitas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      />
      {/* NAVBAR */}
      <FooterNav active="Profile" onNavigate={navigation.replace}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center' },

  header: {
    width: '100%',
    height: 80,
    backgroundColor: '#69a66a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerButton: { color: '#fff', fontSize: 14, marginLeft: 30 },

  profile: { alignItems: 'center', marginTop: -20, paddingHorizontal: 20 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    marginTop: 20,
  },
  name: { fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  bio: { textAlign: 'center', color: '#999', marginTop: 5 },

  tabs: {
    flexDirection: 'row',
    marginVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
    width: '90%',
  },
  tab: { flex: 1, padding: 10, alignItems: 'center', backgroundColor: '#fff' },
  activeTab: { backgroundColor: '#e6f2e6' },
  tabText: { color: '#999' },
  activeTabText: { color: '#69a66a', fontWeight: 'bold' },

  item: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  itemImage: { width: 55, height: 55, borderRadius: 8, backgroundColor: '#ddd' },
  itemTitulo: { fontWeight: 'bold', fontSize: 16 },
  itemSub: { color: '#666', fontSize: 12 },
  bookmark: { width: 20, height: 20, backgroundColor: '#69a66a', borderRadius: 4 },
});
