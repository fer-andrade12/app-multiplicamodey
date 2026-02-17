import React, {useEffect, useState} from 'react';
import { SafeAreaView, View, Text, FlatList, Button } from 'react-native';

const API = 'http://localhost:3000/api'; // NestJS API base

export default function App() {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    fetch(`${API}/clientes/`).then(r => r.json()).then(setClientes).catch(console.warn);
  }, []);

  return (
    <SafeAreaView style={{flex:1, padding:16}}>
      <Text style={{fontSize:20, marginBottom:12}}>MultiplicaMoney - Clientes</Text>
      <FlatList
        data={clientes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({item}) => (
          <View style={{padding:8, borderBottomWidth:1}}>
            <Text style={{fontWeight:'bold'}}>{item.nome}</Text>
            <Text>CPF: {item.cpf} - Renda: {item.renda_mensal}</Text>
          </View>
        )}
      />
      <Button title="Recarregar" onPress={() => fetch(`${API}/clientes/`).then(r=>r.json()).then(setClientes)} />
    </SafeAreaView>
  );
}
