<<<<<<< HEAD
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ConfigsScreen({ navigation }) {
  const handleLogout = () => {
    Alert.alert(
      "Sair",
      "Tem certeza que deseja sair da sua conta?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();

              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Welcome' }],
                })
              );
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
              Alert.alert("Erro", "Não foi possível fazer logout. Tente novamente.");
            }
          }
        }
      ]
    );
  };

  const handlePress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    } else if (item.action) {
      item.action();
    }
  };

  const settings = [
    {
      id: '1',
      title: 'Ajuda',
      icon: <Ionicons name="help-circle-outline" size={24} color="black" />,
      screen: 'Help'
    },
    {
      id: '2',
      title: 'Sobre',
      icon: <Entypo name="info-with-circle" size={24} color="black" />,
      screen: 'About'
    },
    {
      id: '3',
      title: 'Permissões',
      icon: <MaterialIcons name="assignment" size={24} color="black" />,
      screen: "Permissions"
    },
    {
      id: '4',
      title: 'Acessibilidade',
      icon: <FontAwesome5 name="universal-access" size={24} color="black" />,
      screen: 'Accessibility'
    },
    {
      id: '5',
      title: 'Logout',
      icon: <Ionicons name="log-out-outline" size={24} color="#dc2626" />,
      action: handleLogout,
      isDestructive: true
    },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handlePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.icon}>{item.icon}</View>
      <Text style={[styles.title, item.isDestructive && styles.destructiveText]}>{item.title}</Text>
      {!item.isDestructive && <Ionicons name="chevron-forward" size={20} color="black" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.header}>Configurações</Text>
        <View style={styles.backButton} />
      </View>
      <FlatList
        data={settings}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  icon: {
    width: 30,
    alignItems: 'center',
    marginRight: 15,
  },
  title: {
    flex: 1,
    fontSize: 18,
  },
  destructiveText: {
    color: '#dc2626',
  },
  separator: {
    height: 1,
    backgroundColor: '#000',
    opacity: 0.1,
  },
});
=======
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function ConfigsScreen({ navigation }) {
  const { signOut } = useAuth();

  const settings = [
    { id: '1', title: 'Ajuda', icon: <Ionicons name="help-circle-outline" size={24} color="black" /> },
    { id: '2', title: 'Sobre', icon: <Entypo name="info-with-circle" size={24} color="black" /> },
    { id: '3', title: 'Permissões', icon: <MaterialIcons name="assignment" size={24} color="black" />, screen: "Permissions" },
    { id: '4', title: 'Acessibilidade', icon: <FontAwesome5 name="universal-access" size={24} color="black" />},
    { id: '5', title: 'Logout', icon: <Ionicons name="log-out-outline" size={24} color="black" />},
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={async () => {
        if (item.title === "Logout") {
          await signOut(); // 🔥 faz logout
          return;
        }

        if (item.screen) {
          navigation.navigate(item.screen);
        } else {
          console.log(`${item.title} clicado`);
        }
      }}
    >
      <View style={styles.icon}>{item.icon}</View>
      <Text style={styles.title}>{item.title}</Text>
      <Ionicons name="chevron-forward" size={20} color="black" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Configurações</Text>
      <FlatList
        data={settings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 50, paddingHorizontal: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  icon: { width: 30, alignItems: 'center', marginRight: 15 },
  title: { flex: 1, fontSize: 18 },
  separator: { height: 1, backgroundColor: '#000', opacity: 0.1 },
});
>>>>>>> origin/integracao-funciona-por-favor
